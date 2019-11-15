import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {getCategoryById, getTopicById} from '../../core/store/value.selectors';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {CalendarRequested} from '../../core/store/calendar.actions';
import {RequestInstruction, UpdateInstruction, UpsertInstruction} from '../../core/store/instruction.actions';
import {getInstructionById} from '../../core/store/instruction.selectors';
import {Instruction} from '../../core/store/instruction.model';
import {filter, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getEventsByIds} from '../../core/store/event.selectors';
import {AuthService, User} from '../../core/service/auth.service';
import {Event} from '../../model/event';
import {Category, Topic} from '../../model/value';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {CreateEvent, UpdateEvent} from '../../core/store/event.actions';
import {Instruction as RawInstruction} from '../../model/instruction';

@Component({
  selector: 'avk-instruction-detail',
  templateUrl: './instruction-detail.component.html',
  styleUrls: ['./instruction-detail.component.css']
})

export class InstructionDetailComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  private instructionSubject = new BehaviorSubject<FormGroup>(undefined);
  private topicSubject = new BehaviorSubject<FormGroup>(undefined);
  private categorySubject = new BehaviorSubject<FormGroup>(undefined);
  private eventsSubject = new BehaviorSubject<FormArray>(undefined);
  private instructionChangeSubject = new BehaviorSubject<Instruction>(undefined);
  private eventChangeSubject = new BehaviorSubject<Event>(undefined);

  instructionCategory = new BehaviorSubject<string>('');

  instructionGroup$: Observable<FormGroup> = this.instructionSubject.asObservable();
  topicGroup$: Observable<FormGroup> = this.topicSubject.asObservable();
  eventArray$: Observable<FormArray> = this.eventsSubject.asObservable();
  instructionChange$: Observable<Instruction> = this.instructionChangeSubject.asObservable();
  eventChange$: Observable<Event> = this.eventChangeSubject.asObservable();

  instructionId$: Observable<number>;
  instruction$: Observable<Instruction>;
  topic$: Observable<Topic>;
  eventIds$: Observable<number[]>;
  events$: Observable<Event[]>;
  category$: Observable<Category>;

  authState$: Observable<User>;
  userValState = 0;
  display = false;
  currentEventGroup: FormGroup = undefined;
  eventNumber: number[];

  constructor(private store: Store<AppState>, private userService: AuthService) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit(): void {

    this.authState$ = this.userService.user$;
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

    this.instructionId$ = this.store.select(selectRouterDetailId);

    this.instruction$ = this.instructionId$.pipe(
      takeUntil(this.destroySubject),
      flatMap(id => this.store.pipe(
        select(getInstructionById(id)),
        tap(instruction => {
          if (!instruction) {
            this.store.dispatch(new RequestInstruction({id}));
          } else {
            const instructionGroup = instructionGroupFactory(instruction);
            instructionGroup.valueChanges.pipe(
              takeUntil(this.destroySubject)
            ).subscribe(
              value => this.instructionChangeSubject.next(value)
            );
            this.instructionSubject.next(instructionGroup);
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.topic$ = this.instruction$.pipe(
      takeUntil(this.destroySubject),
      filter(instruction => !!instruction),
      flatMap(instruction => this.store.pipe(
        select(getTopicById(instruction.topicId)),
        tap(topic => {
          if (!topic) {
            this.store.dispatch((new ValuesRequested()));
          } else {
            this.topicSubject.next(topicGroupFactory(topic));
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.category$ = this.topic$.pipe(
      takeUntil(this.destroySubject),
      filter(topic => !!topic),
      flatMap(topic => this.store.pipe(
        select(getCategoryById(topic.id)),
        tap(category => {
          if (!category) {
            this.store.dispatch((new ValuesRequested()));
          } else {
            this.categorySubject.next(categoryGroupFactory(category));
          }
          if (category.indoor) {
            this.instructionCategory.next('indoor');
          } else if (category.summer) {
            this.instructionCategory.next('summer');
          } else if (category.winter) {
            this.instructionCategory.next('winter');
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.eventIds$ = this.instruction$.pipe(
      takeUntil(this.destroySubject),
      filter(instruction => !!instruction),
      map(instruction => [instruction.instructionId, ...instruction.meetingIds]),
      tap(instruction => this.eventNumber = instruction),
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

    this.instructionId$.subscribe();
    this.instruction$.subscribe();
    this.topic$.subscribe();
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

    this.instructionChange$.pipe(
      takeUntil(this.destroySubject),
      filter(instruction => !!instruction),
      publishReplay(1),
      refCount(),
    ).subscribe(
      instruction => this.store.dispatch(
        new UpdateInstruction({instruction: {id: instruction.id, changes: {
          ...instruction,
              admission: (instruction.admission * 100),
              advances: (instruction.advances * 100),
              extraCharges: (instruction.extraCharges * 100)
        }}})
      )
    );
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.instructionSubject.complete();
    this.topicSubject.complete();
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
    this.store.dispatch(new CreateEvent({id: this.instructionSubject.value.get('id').value}));
  }

  save(instruction) {
    this.store.dispatch(new UpsertInstruction({instruction: instruction as Instruction}));
  }
}


function instructionGroupFactory(instruction: Instruction): FormGroup {
  return new FormGroup({
    id: new FormControl(instruction.id),
    reference: new FormControl(instruction.reference),
    guideId: new FormControl(instruction.guideId),
    teamIds: new FormControl(instruction.teamIds),
    topicId: new FormControl(instruction.topicId),
    instructionId: new FormControl(instruction.instructionId),
    meetingIds: new FormControl(instruction.meetingIds),
    lowEmissionAdventure: new FormControl(instruction.lowEmissionAdventure),
    ladiesOnly: new FormControl(instruction.ladiesOnly),
    isSpecial: new FormControl(instruction.isSpecial),
    categoryId: new FormControl(instruction.categoryId),
    qualificationIds: new FormControl(instruction.qualificationIds),
    preconditions: new FormControl(instruction.preconditions),
    equipmentIds: new FormControl(instruction.equipmentIds),
    miscEquipment: new FormControl(instruction.miscEquipment),
    equipmentService: new FormControl(instruction.equipmentService),
    admission: new FormControl((instruction.admission / 100).toFixed(2)),
    advances: new FormControl((instruction.advances / 100).toFixed(2)),
    advancesInfo: new FormControl(instruction.advancesInfo),
    extraCharges: new FormControl((instruction.extraCharges / 100).toFixed(2)),
    extraChargesInfo: new FormControl(instruction.extraChargesInfo),
    minQuantity: new FormControl(instruction.minQuantity),
    maxQuantity: new FormControl(instruction.maxQuantity),
    curQuantity: new FormControl(instruction.curQuantity),
    stateId: new FormControl(instruction.stateId)
  });
}

function topicGroupFactory(topic: Topic): FormGroup {
  return new FormGroup({
    id: new FormControl(topic.id),
    code: new FormControl(topic.code),
    title: new FormControl(topic.title),
    name: new FormControl(topic.name),
    description: new FormControl(topic.description),
    preconditions: new FormControl(topic.preconditions),
    qualificationIds: new FormControl(topic.qualificationIds),
    equipmentIds: new FormControl(topic.equipmentIds),
    miscEquipment: new FormControl(topic.miscEquipment)
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
    indoor: new FormControl(category.indoor),
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
