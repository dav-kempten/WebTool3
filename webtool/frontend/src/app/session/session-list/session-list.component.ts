import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {SessionSummary} from '../../model/session';
import {MenuItem} from 'primeng/api';
import {AuthService, User} from '../../core/service/auth.service';
import {FormControl, FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {CalendarRequested} from '../../core/store/calendar.actions';
import {flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {RequestSessionSummaries} from '../../core/store/session-summary.actions';
import {getSessionSummaries} from '../../core/store/session-summary.selectors';
import {CloneSession, CreateSession, DeactivateSession, DeleteSession} from '../../core/store/session.actions';


@Component({
  selector: 'avk-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.css']
})
export class SessionListComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  sessions$: Observable<SessionSummary[]>;
  activeItem$: Observable<MenuItem>;
  display = false;

  finishedSessions = [6, 7, 8];

  partNewSession = new BehaviorSubject<string>('');

  user$: Observable<User>;
  authState$: Observable<User>;
  userValState = 0;

  collectiveId = new FormControl('');
  startDate = new FormControl('');

  createSession: FormGroup = new FormGroup({
    collectiveId: this.collectiveId,
    startDate: this.startDate
  });

  menuItems: MenuItem[] = [
    {label: 'Gruppentermine', routerLink: ['/sessions']},
  ];

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit() {
    this.authState$ = this.authService.user$;
    this.authState$.pipe(
      tap(value => {
        if (value.role === 'Administrator') {
          this.userValState = 4;
        } else if (value.role === 'Geschäftsstelle') {
          this.userValState = 3;
        } else if (value.role === 'Fachbereichssprecher') {
          this.userValState = 2;
        } else if (value.role === 'Trainer') {
          this.userValState = 1;
        } else { this.userValState = 0; }
      }),
    ).subscribe();

    this.part$ = this.store.pipe(
      takeUntil(this.destroySubject),
      select(selectRouterFragment),
      publishReplay(1),
      refCount()
    );

    this.activeItem$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      map(part => {
        return this.menuItems[0];
      }),
      publishReplay(1),
      refCount()
    );

    this.sessions$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      flatMap( part =>
        this.store.pipe(
          select(getSessionSummaries),
          tap(sessions => {
            if (!sessions || !sessions.length) {
              this.store.dispatch(new RequestSessionSummaries());
            }
          }),
        )
      ),
      publishReplay(1),
      refCount()
    );

    this.part$.subscribe();
    this.activeItem$.subscribe();
    this.sessions$.subscribe();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  selectSession(session): void {
    this.router.navigate(['sessions', session.id]);
  }

  handleClick() {
    this.display = true;
  }

  create(collective, date) {
    this.store.dispatch(new CreateSession({collectiveId: collective, startDate: date}));
    this.display = false;
  }

  clone(sessionId) {
    this.store.dispatch(new CloneSession({id: sessionId}));
  }

  delete(sessionId) {
    this.store.dispatch(new DeleteSession({id: sessionId}));
  }

  deactivate(sessionId) {
    this.store.dispatch(new DeactivateSession({id: sessionId}));
  }

}
