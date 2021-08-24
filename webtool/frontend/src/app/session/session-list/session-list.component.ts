import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {SessionSummary} from '../../model/session';
import {ConfirmationService, MenuItem} from 'primeng/api';
import {AuthService} from '../../core/service/auth.service';
import {FormControl, FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {filter, first, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {RequestSessionSummaries} from '../../core/store/session-summary.actions';
import {getSessionSummaries} from '../../core/store/session-summary.selectors';
import {CloneSession, CreateSession, DeleteSession, RequestSession} from '../../core/store/session.actions';
import {getSessionById} from '../../core/store/session.selectors';
import {Permission, PermissionLevel} from '../../core/service/permission.service';
import {Collective, getStatesOfGroup, StatesGroup} from '../../model/value';
import {getCollectiveById, getCollectives} from '../../core/store/value.selectors';


@Component({
  selector: 'avk-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.css']
})
export class SessionListComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('dt') dt;

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  sessions$: Observable<SessionSummary[]>;
  activeItem$: Observable<MenuItem>;
  collectives$: Observable<Collective[]>;

  display = false;

  permissionHandler$: Observable<boolean>;
  permissionCurrent$: Observable<Permission>;

  collectiveManagers = new BehaviorSubject<{id: number, managers: number[]}[]>([]);
  partNewSession = new BehaviorSubject<string>('');

  collectiveId = new FormControl('');
  startDate = new FormControl('');

  createSession: FormGroup = new FormGroup({
    collectiveId: this.collectiveId,
    startDate: this.startDate
  });

  menuItems: MenuItem[] = [
    {label: 'Gruppentermine', routerLink: ['/sessions']},
    {label: 'Jungmannschaft', url: '/sessions#gjm'},
    {label: 'Bergwandergruppe', url: '/sessions#gbw'},
    {label: 'Ortsgruppe Obergünzburg', url: '/sessions#obg'},
    {label: 'HiKE', url: '/sessions#hkw'},
    {label: 'Alpine Abendschule', url: '/sessions#aas'},
    {label: 'Vollmondstammtisch', url: '/sessions#vst'}
  ];

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService,
              private confirmationService: ConfirmationService) { }

  ngOnInit() {
    this.permissionCurrent$ = this.authService.guidePermission$;

    this.part$ = this.store.pipe(
      takeUntil(this.destroySubject),
      select(selectRouterFragment),
      publishReplay(1),
      refCount()
    );

    this.activeItem$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      map(part => {
        switch (part) {
          case 'gjm':
            return this.menuItems[1];
          case 'gbw':
            return this.menuItems[2];
          case 'obg':
            return this.menuItems[3];
          case 'hkw':
            return this.menuItems[4];
          case 'aas':
            return this.menuItems[5];
          case 'vst':
            return this.menuItems[6];
          default:
            return this.menuItems[0];
        }
      }),
      publishReplay(1),
      refCount()
    );

    this.sessions$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      flatMap( part =>
        this.store.pipe(
          takeUntil(this.destroySubject),
          select(getSessionSummaries),
          tap(sessions => {
            if (!sessions || !sessions.length) {
              this.store.dispatch(new RequestSessionSummaries());
            } else {
              this.permissionHandler$ = this.permissionCurrent$.pipe(
                takeUntil(this.destroySubject),
                map(permission => {
                  return permission.permissionLevel >= PermissionLevel.coordinator;
                })
              );
            }
          }),
          map(sessions =>
            sessions.filter(session =>
              (part === 'gjm' && session.reference.substr(0, 3).toLowerCase() === 'gjm') ||
              (part === 'gbw' && session.reference.substr(0, 3).toLowerCase() === 'gbw') ||
              (part === 'obg' && session.reference.substr(0, 3).toLowerCase() === 'obg') ||
              (part === 'hkw' && session.reference.substr(0, 3).toLowerCase() === 'hkw') ||
              (part === 'aas' && session.reference.substr(0, 3).toLowerCase() === 'aas') ||
              (part === 'vst' && session.reference.substr(0, 3).toLowerCase() === 'vst') ||
              !part
            )
          ),
          tap(() => this.partNewSession.next(part)),
        )
      ),
      publishReplay(1),
      refCount()
    );

    this.collectives$ = this.store.pipe(
      takeUntil(this.destroySubject),
      select(getCollectives),
      publishReplay(1),
      refCount()
    );

    this.part$.subscribe();
    this.activeItem$.subscribe();
    this.sessions$.subscribe();

    /* Store all manager/collective pair in BehaviourSubject */
    this.collectives$.subscribe(collective => {
      this.collectiveManagers.next(collective
        .map(value => ({id: value.id, managers: value.managers}))
      );
    });
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngAfterViewInit(): void {
    this.dt.filter(getStatesOfGroup(StatesGroup.Active), 'stateId', 'in');
  }

  selectSession(session): void {
    if (!!session) {
      this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe( permission => {
        if (permission.permissionLevel >= PermissionLevel.coordinator) {
          this.router.navigate(['sessions', session.id]);
        } else if (this.collectiveManagers.value.find(value => value.id === session.collectiveId).managers.includes(permission.guideId)) {
            this.router.navigate(['sessions', session.id]);
        }
      });
    }
  }

  handleClick() {
    this.display = true;
  }

  create(collective, date) {
    this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe( permission => {
      if (permission.permissionLevel >= PermissionLevel.coordinator) {
        this.store.dispatch(new CreateSession({collectiveId: collective, startDate: date}));
        this.display = false;
      }
    });
  }

  clone(sessionId) {
    this.store.pipe(
      select(getSessionById(sessionId)),
      tap(session => {
        if (!session) {
          this.store.dispatch(new RequestSession({id: sessionId}));
        }
      }),
      filter(session => !!session),
      first(),
    ).subscribe(
      session => {
        this.store.dispatch(new CloneSession({session}));
      }
    );
  }

  confirm(sessionId) {
    this.confirmationService.confirm({
      message: 'Gruppentermin endgültig löschen?',
      accept: () => {
        this.store.dispatch(new DeleteSession({id: sessionId}));
      }
    });
  }

  filterFinishedSessions(stateId: number): boolean {
    return getStatesOfGroup(StatesGroup.Finished).indexOf(stateId) === -1;
  }

  changeViewSet(event, dt) {
    if (!event.checked) {
      dt.filter(getStatesOfGroup(StatesGroup.Active), 'stateId', 'in');
    } else {
      dt.filter(getStatesOfGroup(StatesGroup.All), 'stateId', 'in');
    }
  }

}
