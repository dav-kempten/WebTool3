import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {getCategoryById, getTopicById} from '../../core/store/value.selectors';
import {ValuesRequested} from '../../core/store/value.actions';
import {
  AddEventInstruction,
  DeleteEventInstruction,
  DeleteInstruction,
  RequestInstruction,
  UpdateInstruction,
  UpsertInstruction
} from '../../core/store/instruction.actions';
import {getInstructionById} from '../../core/store/instruction.selectors';
import {Instruction} from '../../core/store/instruction.model';
import {filter, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getEventsByIds} from '../../core/store/event.selectors';
import {AuthService, User} from '../../core/service/auth.service';
import {Event} from '../../model/event';
import {Category, Topic} from '../../model/value';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {UpdateEvent} from '../../core/store/event.actions';

@Component({
  selector: 'avk-instruction-detail',
  templateUrl: './instruction-detail.component.html',
  styleUrls: ['./instruction-detail.component.css']
})

export class InstructionDetailComponent implements OnInit, OnDestroy {

  private destroySubject: Subject<boolean> = new Subject<boolean>();
  private instructionSubject = new BehaviorSubject<FormGroup>(undefined);
  private topicSubject = new BehaviorSubject<FormGroup>(undefined);
  private categorySubject = new BehaviorSubject<FormGroup>(undefined);
  private eventsSubject = new BehaviorSubject<FormArray>(undefined);
  private instructionChangeSubject = new BehaviorSubject<Instruction>(undefined);
  private eventChangeSubject = new BehaviorSubject<Event>(undefined);
  instructionOwner = new BehaviorSubject<boolean>(undefined);

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
  userIsStaff$: Observable<boolean>;
  userIsAdmin$: Observable<boolean>;
  userIsOwner$: Observable<boolean> = this.instructionOwner.asObservable();
  userCurrent$: Observable<number>;

  display = false;
  currentEventGroup: FormGroup = undefined;
  eventNumber: number[];

  constructor(private store: Store<AppState>, private userService: AuthService) { }

  ngOnInit(): void {
    this.userIsStaff$ = this.userService.isStaff$;
    this.userIsAdmin$ = this.userService.isAdministrator$;

    this.userCurrent$ = this.userService.guideId$;

    this.instructionId$ = this.store.select(selectRouterDetailId);

    this.instruction$ = this.instructionId$.pipe(
      takeUntil(this.destroySubject),
      flatMap(id => this.store.pipe(
        takeUntil(this.destroySubject),
        select(getInstructionById(id)),
        tap(instruction => {
          if (!instruction) {
            this.store.dispatch(new RequestInstruction({id}));
          } else {
            /* Check if current user is owner of instruction */
            this.userCurrent$.pipe(
              takeUntil(this.destroySubject),
              tap(value => this.instructionOwner.next(instruction.guideId === value))
            ).subscribe();
            /* Generate instruction */
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
        takeUntil(this.destroySubject),
        filter(() => !!eventIds && eventIds.length > 0),
        tap(events => {
          const eventArray = new FormArray([]);
          events.forEach((event: Event) => {
            const eventGroup = eventGroupFactory(event);
            eventGroup.valueChanges.pipe(
              takeUntil(this.destroySubject)
            ).subscribe(value => this.eventChangeSubject.next(value));
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
        new UpdateInstruction({instruction: {id: instruction.id, changes: {...instruction}}})
      )
    );
  }

  ngOnDestroy(): void {
    this.destroySubject.next(true);
    this.destroySubject.unsubscribe();

    this.instructionSubject.complete();
    this.topicSubject.complete();
    this.categorySubject.complete();
    this.eventsSubject.complete();
  }

  selectEvent(index) {
    this.eventArray$.subscribe(
      eventArray => this.currentEventGroup = (eventArray.at(index.data)) as FormGroup).unsubscribe();
    this.display = true;
  }

  closeDialog() {
    this.currentEventGroup = undefined;
  }

  /* Notizen: Bei der Erstellung eines zusätzlichen Events muss das Event erst serverseitig werden und der
   * Cache aktualisiert werden. So wird sichergestellt das die Kurse konsistent parallel bearbeitet werden können. */
  addEvent(instruction) {
    this.store.dispatch(new AddEventInstruction({instruction: instruction as Instruction}));
  }

  save(instruction) {
    this.store.dispatch(new UpsertInstruction({instruction: instruction as Instruction}));
  }

  deleteEvent(instruction, eventId) {
    this.store.dispatch(new DeleteEventInstruction({instruction, eventId}));
  }

  deleteInstruction(instructionId) {
    this.store.dispatch(new DeleteInstruction({id: instructionId}));
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
    ladiesOnly: new FormControl(instruction.ladiesOnly),
    isSpecial: new FormControl(instruction.isSpecial),
    categoryId: new FormControl(instruction.categoryId),
    qualificationIds: new FormControl(instruction.qualificationIds),
    preconditions: new FormControl(instruction.preconditions),
    equipmentIds: new FormControl(instruction.equipmentIds),
    miscEquipment: new FormControl(instruction.miscEquipment),
    equipmentService: new FormControl(instruction.equipmentService),
    admission: new FormControl(instruction.admission),
    advances: new FormControl(instruction.advances),
    advancesInfo: new FormControl(instruction.advancesInfo),
    extraCharges: new FormControl(instruction.extraCharges),
    extraChargesInfo: new FormControl(instruction.extraChargesInfo),
    minQuantity: new FormControl(instruction.minQuantity),
    maxQuantity: new FormControl(instruction.maxQuantity),
    curQuantity: new FormControl(instruction.curQuantity),
    stateId: new FormControl(instruction.stateId),
    comment: new FormControl(instruction.comment),
    message: new FormControl(instruction.message)
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
    endTime: new FormControl(event.endTime),
    rendezvous: new FormControl(event.rendezvous),
    location: new FormControl(event.location),
    reservationService: new FormControl(event.reservationService),
    lea: new FormControl(event.lea),
    source: new FormControl(event.source),
    link: new FormControl(event.link),
    map: new FormControl(event.map),
    distal: new FormControl(event.distal),
    distance: new FormControl(event.distance),
    publicTransport: new FormControl(event.publicTransport),
    shuttleService: new FormControl(event.shuttleService)
  });
}
