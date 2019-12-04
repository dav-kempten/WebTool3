import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Session} from '../../core/store/session.model';
import {Event} from '../../model/event';
import {Collective} from '../../model/value';
import {User} from '../../core/service/auth.service';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {CalendarRequested} from '../../core/store/calendar.actions';
import {filter, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getSessionById} from '../../core/store/session.selectors';
import {RequestSession, UpsertSession} from '../../core/store/session.actions';
import {getCollectiveById} from '../../core/store/value.selectors';
import {getEventsByIds} from '../../core/store/event.selectors';
import {CreateEvent, UpdateEvent} from '../../core/store/event.actions';
import {UpdateSession} from '../../core/store/session.actions';

@Component({
  selector: 'avk-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.css']
})
export class SessionDetailComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  private sessionSubject = new BehaviorSubject<FormGroup>(undefined);
  private collectiveSubject = new BehaviorSubject<FormGroup>(undefined);
  private eventsSubject = new BehaviorSubject<FormArray>(undefined);
  private sessionChangeSubject = new BehaviorSubject<Session>(undefined);
  private eventChangeSubject = new BehaviorSubject<Event>(undefined);

  sessionGroup$: Observable<FormGroup> = this.sessionSubject.asObservable();
  sessionChange$: Observable<Session> = this.sessionChangeSubject.asObservable();
  eventArray$: Observable<FormArray> = this.eventsSubject.asObservable();
  eventChange$: Observable<Event> = this.eventChangeSubject.asObservable();

  sessionId$: Observable<number>;
  session$: Observable<Session>;
  eventIds$: Observable<number[]>;
  events$: Observable<Event[]>;
  collective$: Observable<Collective>;

  authState$: Observable<User>;
  userValState = 0;
  display = false;
  currentEventGroup: FormGroup = undefined;
  eventNumber: number[];

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit(): void {
    this.sessionId$ = this.store.select(selectRouterDetailId);

    this.session$ = this.sessionId$.pipe(
      takeUntil(this.destroySubject),
      flatMap(id => this.store.pipe(
        select(getSessionById(id)),
        tap(session => {
          if (!session) {
            this.store.dispatch(new RequestSession({id}));
          } else {
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
        select(getCollectiveById(session.collectiveId)),
        tap(collective => {
          if (!collective) {
            this.store.dispatch((new ValuesRequested()));
          } else {
            this.collectiveSubject.next(collectiveGroupFactory(collective));
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

    this.sessionId$.subscribe();
    this.session$.subscribe();
    this.collective$.subscribe();
    this.eventIds$.subscribe();
    this.events$.subscribe();

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
      filter(tour => !!tour),
      publishReplay(1),
      refCount(),
    ).subscribe(
      session => this.store.dispatch(
        new UpdateSession({session: {id: session.id, changes: {...session}}})
      )
    );
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.sessionSubject.complete();
    this.collectiveSubject.complete();
    this.eventsSubject.complete();
  }

  selectEvent(index) {
    this.eventArray$.subscribe(
      eventArray => this.currentEventGroup = (eventArray.at(index)) as FormGroup
    );
    this.display = true;
  }

  switchDistal(isDistal, distal) {
    distal.disabled = !isDistal;
  }

  addEvent() {
    this.store.dispatch(new CreateEvent({id: this.sessionSubject.value.get('id').value}));
  }

  saveSession(session) {
    this.store.dispatch(new UpsertSession({session: session as Session}));
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
    rendezvous: new FormControl(event.rendezvous),
    location: new FormControl(event.location),
    reservationService: new FormControl(event.reservationService),
    source: new FormControl(event.source),
    link: new FormControl(event.link),
    map: new FormControl(event.map),
    distal: new FormControl(event.distal),
    distance: new FormControl({value: event.distance, disabled: !event.distal}),
    publicTransport: new FormControl(event.publicTransport),
    shuttleService: new FormControl(event.shuttleService)
  });
}
