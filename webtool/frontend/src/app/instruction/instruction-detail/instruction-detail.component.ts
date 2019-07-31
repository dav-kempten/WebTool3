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
import {FormArray, FormGroup} from '@angular/forms';
import {AddEvent, UpdateEvent} from '../../core/store/event.actions';
import {
  categoryGroupFactory,
  eventGroupFactory,
  instructionGroupFactory,
  topicGroupFactory
} from "../../core/factories";

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

  instructionGroup$: Observable<FormGroup> = this.instructionSubject.asObservable();
  topicGroup$: Observable<FormGroup> = this.topicSubject.asObservable();
  categoryGroup$: Observable<FormGroup> = this.categorySubject.asObservable();
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
  climbingTopicIds: number[] = [18, 26, 31, 46, 45, 44, 35, 41, 97, 92, 32, 56, 57, 100, 47];
  eventNumber: number[];

  constructor(private store: Store<AppState>, private userService: AuthService) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit(): void {

    this.authState$ = this.userService.user$;
    this.authState$.pipe(
      tap(value => console.log(value)),
      tap(value => {
        if (value.role === "Administrator") {this.userValState = 4;}
        else if(value.role === 'Geschäftsstelle') {this.userValState = 3;}
        else if(value.role === 'Fachbereichssprecher') {this.userValState = 2;}
        else if(value.role === 'Trainer') {this.userValState = 1;}
        else {this.userValState = 0;}
      }),
      tap(() => console.log("UserValState", this.userValState)),
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
      tap(instruction => console.log(instruction)),
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
      tap(event => console.log(event)),
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
      tap(instruction => console.log(instruction)),
      publishReplay(1),
      refCount()
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
    // console.log(index);
  }

  switchDistal(isDistal, distal) {
    distal.disabled = !isDistal;
  }

  addEvent() {
    this.eventNumber.push(this.eventNumber[this.eventNumber.length-1] + 1);

    console.log(this.eventNumber);

    let event: Event = {
      id: this.eventNumber[this.eventNumber.length-1],
      title: "",
      name: "",
      description: "",
      startDate: "",
      startTime: null,
      approximateId: null,
      endDate: null,
      endTime: null,
      rendezvous: "",
      location: "",
      reservationService: false,
      source: "",
      link: "",
      map: "",
      distal: false,
      distance: 0,
      publicTransport: false,
      shuttleService: false,
      deprecated: false,
    };

    this.store.dispatch(new AddEvent({event}));
    this.instructionSubject['meetingsIds'] = this.eventNumber;
  }
}
