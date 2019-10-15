import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
import {Tour} from '../../core/store/tour.model';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {CalendarRequested} from '../../core/store/calendar.actions';
import {Category, Topic} from '../../model/value';
import {Event} from '../../model/event';
import {User} from '../../core/service/auth.service';
import {filter, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getTourById} from '../../core/store/tour.selectors';
import {RequestTour, UpdateTour} from '../../core/store/tour.actions';
import {getCategoryById, getTopicById} from '../../core/store/value.selectors';
import {getEventsByIds} from '../../core/store/event.selectors';
import {CreateEvent, UpdateEvent} from '../../core/store/event.actions';

@Component({
  selector: 'avk-tour-detail',
  templateUrl: './tour-detail.component.html',
  styleUrls: ['./tour-detail.component.css']
})
export class TourDetailComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  private tourSubject = new BehaviorSubject<FormGroup>(undefined);
  private categorySubject = new BehaviorSubject<FormGroup>(undefined);
  private eventsSubject = new BehaviorSubject<FormArray>(undefined);
  private tourChangeSubject = new BehaviorSubject<Tour>(undefined);
  private eventChangeSubject = new BehaviorSubject<Event>(undefined);

  tourCategory = new BehaviorSubject<string>('');

  tourGroup$: Observable<FormGroup> = this.tourSubject.asObservable();
  tourChange$: Observable<Tour> = this.tourChangeSubject.asObservable();
  eventArray$: Observable<FormArray> = this.eventsSubject.asObservable();
  eventChange$: Observable<Event> = this.eventChangeSubject.asObservable();

  tourId$: Observable<number>;
  tour$: Observable<Tour>;
  eventIds$: Observable<number[]>;
  events$: Observable<Event[]>;
  category$: Observable<Category>;

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
    this.tourId$ = this.store.select(selectRouterDetailId);

    this.tour$ = this.tourId$.pipe(
      takeUntil(this.destroySubject),
      flatMap(id => this.store.pipe(
        select(getTourById(id)),
        tap(tour => {
          if (!tour) {
            this.store.dispatch(new RequestTour({id}));
          } else {
            const tourGroup = tourGroupFactory(tour);
            tourGroup.valueChanges.pipe(
              takeUntil(this.destroySubject)
            ).subscribe(
              value => this.tourChangeSubject.next(value)
            );
            this.tourSubject.next(tourGroup);
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.category$ = this.tour$.pipe(
      takeUntil(this.destroySubject),
      filter(tour => !!tour),
      flatMap(tour => this.store.pipe(
        select(getCategoryById(tour.categoryId)),
        tap(category => {
          if (!category) {
            this.store.dispatch((new ValuesRequested()));
          } else {
            this.categorySubject.next(categoryGroupFactory(category));
          }
          if (category.indoor) {
            this.tourCategory.next('indoor');
          } else if (category.summer) {
            this.tourCategory.next('summer');
          } else if (category.winter) {
            this.tourCategory.next('winter');
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.eventIds$ = this.tour$.pipe(
      takeUntil(this.destroySubject),
      filter(tour => !!tour),
      map(tour => [tour.tourId, tour.deadlineId, tour.preliminaryId]),
      tap(tour => this.eventNumber = tour),
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

    this.tourId$.subscribe();
    this.tour$.subscribe();
    this.category$.subscribe();
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

    this.tourChange$.pipe(
      takeUntil(this.destroySubject),
      filter(tour => !!tour),
      publishReplay(1),
      refCount(),
    ).subscribe(
      tour => this.store.dispatch(
        new UpdateTour({tour: {id: tour.id, changes: {
          ...tour,
              admission: (tour.admission * 100),
              advances: (tour.advances * 100),
              extraCharges: (tour.extraCharges * 100)
        }}})
      )
    );
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.tourSubject.complete();
    this.categorySubject.complete();
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
    this.store.dispatch(new CreateEvent({id: this.tourSubject.value.get('id').value}));
  }

}



export function tourGroupFactory(tour: Tour): FormGroup {
  return new FormGroup({
    id: new FormControl(tour.id),
    reference: new FormControl(tour.reference),
    guideId: new FormControl(tour.guideId),
    teamIds: new FormControl(tour.teamIds),
    categoryId: new FormControl(tour.categoryId),
    categoryIds: new FormControl(tour.categoryIds),
    tour: new FormControl(tour.tourId),
    deadline: new FormControl(tour.deadlineId),
    preliminary: new FormControl(tour.preliminaryId),
    youthOnTour: new FormControl(tour.youthOnTour),
    lowEmissionAdventure: new FormControl(tour.lowEmissionAdventure),
    ladiesOnly: new FormControl(tour.ladiesOnly),
    qualificationIds: new FormControl(tour.qualificationsIds),
    preconditions: new FormControl(tour.preconditions),
    equipmentIds: new FormControl(tour.equipmentIds),
    miscEquipment: new FormControl(tour.miscEquipment),
    equipmentService: new FormControl(tour.equipmentService),
    skillId: new FormControl(tour.skillId),
    fitnessId: new FormControl(tour.fitnessId),
    admission: new FormControl((tour.admission / 100).toFixed(2)),
    advances: new FormControl((tour.advances / 100).toFixed(2)),
    advancesInfo: new FormControl(tour.advancesInfo),
    extraCharges: new FormControl((tour.extraCharges / 100).toFixed(2)),
    // extraChargesInfo: new FormControl(this.extraChargesInfo),
    minQuantity: new FormControl(tour.minQuantity),
    maxQuantity: new FormControl(tour.maxQuantity),
    curQuantity: new FormControl(tour.curQuantity),
    stateId: new FormControl(tour.stateId),
  });
}

function categoryGroupFactory(category: Category): FormGroup {
  return new FormGroup({
    id: new FormControl(category.id),
    code: new FormControl(category.code),
    name: new FormControl(category.name),
    tour: new FormControl(category.tour),
    talk: new FormControl(category.talk),
    instruction: new FormControl(category.instruction),
    collective: new FormControl(category.collective),
    winter: new FormControl(category.winter),
    summer: new FormControl(category.summer),
    youth: new FormControl(category.indoor),
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
