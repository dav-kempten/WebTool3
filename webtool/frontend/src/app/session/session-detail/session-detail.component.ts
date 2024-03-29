import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Session} from '../../core/store/session.model';
import {Event} from '../../model/event';
import {Collective} from '../../model/value';
import {AuthService, User} from '../../core/service/auth.service';
import {ValuesRequested} from '../../core/store/value.actions';
import {filter, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getSessionById} from '../../core/store/session.selectors';
import {DeleteSession, RequestSession, UpdateSession, UpsertSession} from '../../core/store/session.actions';
import {getCollectiveById, getCollectives} from '../../core/store/value.selectors';
import {getEventsByIds} from '../../core/store/event.selectors';
import {CreateEvent, UpdateEvent} from '../../core/store/event.actions';
import {ConfirmationService} from 'primeng/api';
import {Permission, PermissionLevel} from '../../core/service/permission.service';

@Component({
  selector: 'avk-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.css']
})
export class SessionDetailComponent implements OnInit, OnDestroy {

  private destroySubject: Subject<boolean> = new Subject<boolean>();
  private sessionSubject = new BehaviorSubject<FormGroup>(undefined);
  private collectiveSubject = new BehaviorSubject<FormGroup>(undefined);
  private eventsSubject = new BehaviorSubject<FormArray>(undefined);
  private sessionChangeSubject = new BehaviorSubject<Session>(undefined);
  private eventChangeSubject = new BehaviorSubject<Event>(undefined);
  private collectiveManagers = new BehaviorSubject<{id: number, managers: number[]}[]>([]);

  sessionGroup$: Observable<FormGroup> = this.sessionSubject.asObservable();
  sessionChange$: Observable<Session> = this.sessionChangeSubject.asObservable();
  eventArray$: Observable<FormArray> = this.eventsSubject.asObservable();
  eventChange$: Observable<Event> = this.eventChangeSubject.asObservable();
  collectiveGroup$: Observable<FormGroup> = this.collectiveSubject.asObservable();

  sessionId$: Observable<number>;
  session$: Observable<Session>;
  eventIds$: Observable<number[]>;
  events$: Observable<Event[]>;
  collective$: Observable<Collective>;
  collectives$: Observable<Collective[]>;

  permissionHandler$: Observable<boolean>;
  permissionCurrent$: Observable<Permission>;

  display = false;
  currentEventGroup: FormGroup = undefined;
  eventNumber: number[];

  constructor(private store: Store<AppState>, private authService: AuthService, private confirmationService: ConfirmationService) {  }

  ngOnInit(): void {
    this.permissionCurrent$ = this.authService.guidePermission$;

    this.sessionId$ = this.store.select(selectRouterDetailId);

    this.session$ = this.sessionId$.pipe(
      takeUntil(this.destroySubject),
      flatMap(id => this.store.pipe(
        takeUntil(this.destroySubject),
        select(getSessionById(id)),
        tap(session => {
          if (!session) {
            this.store.dispatch(new RequestSession({id}));
          } else {
            /* Check if current user is staff-member */
            this.permissionHandler$ = this.permissionCurrent$.pipe(
              takeUntil(this.destroySubject),
              map(permission => {
                return this.collectiveManagers.value
                  .find(value => value.id === session.collectiveId).managers
                  .includes(permission.guideId)
                  || permission.permissionLevel >= PermissionLevel.coordinator;
              })
            );
            /* Generate session */
            const sessionGroup = sessionGroupFactory(session);
            sessionGroup.valueChanges.pipe(
              takeUntil(this.destroySubject)
            ).subscribe(
              value => this.sessionChangeSubject.next(value)
            );
            this.sessionSubject.next(sessionGroup);
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.collective$ = this.session$.pipe(
      takeUntil(this.destroySubject),
      filter(session => !!session),
      flatMap(session => this.store.pipe(
        takeUntil(this.destroySubject),
        select(getCollectiveById(session.collectiveId)),
        tap(collective => {
          if (!collective) {
            this.store.dispatch((new ValuesRequested()));
          } else {
            this.collectiveSubject.next(new FormGroup({collective: new FormControl(collective)}));
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.eventIds$ = this.session$.pipe(
      takeUntil(this.destroySubject),
      filter(session => !!session),
      map(session => [session.sessionId]),
      tap(session => this.eventNumber = session),
      publishReplay(1),
      refCount()
    );

    this.events$ = this.eventIds$.pipe(
      takeUntil(this.destroySubject),
      filter(eventIds => !!eventIds),
      flatMap(eventIds => this.store.select(getEventsByIds(eventIds)).pipe(
        takeUntil(this.destroySubject),
        filter(() => !!eventIds && eventIds.length > 0),
        tap(events => {
          const eventArray = new FormArray([]);
          events.forEach((event: Event) => {
            const eventGroup = eventGroupFactory(event);
            eventGroup.valueChanges.pipe(
              takeUntil(this.destroySubject)
            ).subscribe(
              value => this.eventChangeSubject.next(value)
            );
            eventArray.push(eventGroup);
          });
          this.eventsSubject.next(eventArray);
        })
      )),
      publishReplay(1),
      refCount()
    );

    this.collectives$ = this.store.pipe(
      takeUntil(this.destroySubject),
      select(getCollectives),
      publishReplay(1),
      refCount()
    );

    this.sessionId$.subscribe();
    this.session$.subscribe();
    this.collective$.subscribe();
    this.eventIds$.subscribe();
    this.events$.subscribe();

    /* Store all manager/collective pair in BehaviourSubject */
    this.collectives$.subscribe(collective => {
      this.collectiveManagers.next(collective
        .map(value => ({id: value.id, managers: value.managers}))
      );
    });

    this.eventChange$.pipe(
      takeUntil(this.destroySubject),
      filter(event => !!event),
      publishReplay(1),
      refCount()
    ).subscribe(
      event => this.store.dispatch(
        new UpdateEvent({event: {id: event.id, changes: {...event}}})
      )
    );

    this.sessionChange$.pipe(
      takeUntil(this.destroySubject),
      filter(session => !!session),
      publishReplay(1),
      refCount(),
    ).subscribe(
      session => this.store.dispatch(
        new UpdateSession({session: {id: session.id, changes: {...session}}})
      )
    );
  }

  ngOnDestroy(): void {
    this.destroySubject.next(true);
    this.destroySubject.unsubscribe();

    this.sessionSubject.complete();
    this.collectiveSubject.complete();
    this.eventsSubject.complete();
  }

  selectEvent(index) {
    this.eventArray$.subscribe(
      eventArray => this.currentEventGroup = (eventArray.at(index.data)) as FormGroup
    ).unsubscribe();
    this.display = true;
  }

  addEvent() {
    this.store.dispatch(new CreateEvent({id: this.sessionSubject.value.get('id').value}));
  }

  saveSession(session) {
    this.store.dispatch(new UpsertSession({session: session as Session}));
  }

  confirm(sessionId) {
    this.confirmationService.confirm({
      message: 'Gruppentermin endgültig löschen?',
      accept: () => {
        this.store.dispatch(new DeleteSession({id: sessionId}));
      }
    });
  }

  closeEvent() {
    this.currentEventGroup = undefined;
  }

}


export function sessionGroupFactory(session: Session): FormGroup {
  return new FormGroup({
    id: new FormControl(session.id),
    reference: new FormControl(session.reference),
    guideId: new FormControl(session.guideId),
    teamIds: new FormControl(session.teamIds),
    speaker: new FormControl(session.speaker),
    collectiveId: new FormControl(session.collectiveId),
    sessionId: new FormControl(session.sessionId),
    ladiesOnly: new FormControl(session.ladiesOnly),
    categoryIds: new FormControl(session.categoryIds),
    miscCategory: new FormControl(session.miscCategory),
    equipmentIds: new FormControl(session.equipmentIds),
    miscEquipment: new FormControl(session.miscEquipment),
    message: new FormControl(session.message),
    comment: new FormControl(session.comment),
    stateId: new FormControl(session.stateId),
  });
}

function collectiveGroupFactory(collective: Collective): FormGroup {
  return new FormGroup({
    id: new FormControl(collective.id),
    code: new FormControl(collective.code),
    title: new FormControl(collective.title),
    name: new FormControl(collective.name),
    description: new FormControl(collective.description)
  });
}

function eventGroupFactory(event: Event): FormGroup {
  return new FormGroup({
    id: new FormControl(event.id),
    title: new FormControl(event.title),
    name: new FormControl(event.name),
    description: new FormControl(event.description),
    startDate: new FormControl(event.startDate),
    startTime: new FormControl(event.startTime),
    approximateId: new FormControl(event.approximateId),
    endDate: new FormControl(event.endDate),
    endTime: new FormControl(event.endTime),
    rendezvous: new FormControl(event.rendezvous),
    location: new FormControl(event.location),
    reservationService: new FormControl(event.reservationService),
    source: new FormControl(event.source),
    link: new FormControl(event.link),
    map: new FormControl(event.map),
    distal: new FormControl(event.distal),
    distance: new FormControl(event.distance),
    publicTransport: new FormControl(event.publicTransport),
    shuttleService: new FormControl(event.shuttleService)
  });
}
