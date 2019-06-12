import {Observable} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {NameListRequested} from "../../core/store/name.actions";
import {ValuesRequested} from "../../core/store/value.actions";
import {CalendarRequested} from "../../core/store/calendar.actions";
import {RequestInstruction} from "../../core/store/instruction.actions";
import {getInstructionIsLoading, getInstructionById} from "../../core/store/instruction.selectors";
import {Instruction} from "../../core/store/instruction.model";
import {flatMap, map, tap} from "rxjs/operators";
import {State} from "../../core/store/state.reducer";
import {selectStatesState} from "../../core/store/value.selectors";
import {AuthService, User} from "../../core/service/auth.service";
import {getEventById, getEventsByIds} from "../../core/store/event.selectors";
import {Event} from '../../model/event';

interface Tour {
  type;
  sdate;
  stime;
  edate;
  etime;
  title;
  name;
  location;
}

interface Costs {
  pos;
  beschreibung;
  betrag;
}

@Component({
  selector: 'avk-instruction-detail',
  "styles": ["node_modules/primeflex/primeflex.css"],
  templateUrl: './instruction-detail.component.html',
  styleUrls: ['./instruction-detail.component.css']
})

export class InstructionDetailComponent implements OnInit, OnDestroy {

  instructionId$: Observable<number>;
  isLoading$: Observable<boolean>;
  formInstruction$: Observable<Instruction>;

  eventIds$: Observable<number[]>;
  events$: Observable<Event[]>;
  event$: Observable<Event>;

  formState$: Observable<State>;
  authState$: Observable<User>;

  display: boolean = false;

  eventArray = new FormArray([]);

  tours: Tour[] = [];
  userValState: number = 0;

  /* FormControls for Instruction & Event */
  id = new FormControl('');

  /* FormControls for Event */
  title = new FormControl('');
  name = new FormControl('');
  description = new FormControl('');
  startDate = new FormControl('');
  startTime = new FormControl('');
  approximateId = new FormControl('');
  endDate = new FormControl('');
  endTime = new FormControl('');
  rendevous = new FormControl('');
  location = new FormControl('');
  reservationService = new FormControl('');
  source = new FormControl('');
  link = new FormControl('');
  map = new FormControl('');
  distal = new FormControl('');
  distance = new FormControl('');
  publicTransport = new FormControl('');
  shuttleService = new FormControl('');

  /* FormControls for Instruction */
  reference = new FormControl('');
  guideId = new FormControl(undefined);
  teamIds = new FormControl([]);
  topicId = new FormControl('');
  lowEmissionAdventure = new FormControl('');
  ladiesOnly = new FormControl('');
  isSpecial = new FormControl('');
  categoryId = new FormControl('');
  qualificationIds = new FormControl('');
  preconditions = new FormControl('');
  equipmentIds = new FormControl('');
  miscEquipment = new FormControl('');
  equipmentService = new FormControl('');
  admission = new FormControl('');
  advances = new FormControl('');
  advancesInfo = new FormControl('');
  extraCharges = new FormControl('');
  extraChargesInfo = new FormControl('');
  minQuantity = new FormControl('');
  maxQuantity = new FormControl('');
  curQuantity = new FormControl('');
  stateId = new FormControl('');
  instructionId = new FormControl('');
  meetingIds = new FormControl([]);

  eventForm = new FormGroup({
    id: this.id,
    title: this.title,
    name: this.name,
    description: this.description,
    startDate: this.startDate,
    startTime: this.startTime,
    approximateId: this.approximateId,
    endDate: this.endDate,
    endTime: this.endTime,
    rendevous: this.rendevous,
    location: this.location,
    reservationService: this.reservationService,
    source: this.source,
    link: this.link,
    map: this.map,
    distal: this.distal,
    distance: this.distance,
    publicTransport: this.publicTransport,
    shuttleService: this.shuttleService,
  });


  instructionForm = new FormGroup({
    id: this.id,
    reference: this.reference,
    guideId: this.guideId,
    teamIds: this.teamIds,
    topicId: this.topicId,
    lowEmissionAdventure: this.lowEmissionAdventure,
    ladiesOnly: this.ladiesOnly,
    isSpecial: this.isSpecial,
    categoryId: this.categoryId,
    qualificationIds: this.qualificationIds,
    preconditions: this.preconditions,
    equipmentIds: this.equipmentIds,
    miscEquipment: this.miscEquipment,
    equipmentService: this.equipmentService,
    admission: this.admission,
    advances: this.advances,
    advancesInfo: this.advancesInfo,
    extraCharges: this.extraCharges,
    extraChargesInfo: this.extraChargesInfo,
    minQuantity: this.minQuantity,
    maxQuantity: this.maxQuantity,
    curQuantity: this.curQuantity,
    stateId: this.stateId,
    instructionId: this.instructionId,
    meetingIds: this.meetingIds,
  });

  constructor(private store: Store<AppState>, private userService: AuthService) {
    this.store.dispatch(new NameListRequested());
    this.store.dispatch(new ValuesRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit(): void {
    this.instructionId$ = this.store.pipe(select(selectRouterDetailId));
    this.isLoading$ = this.store.select(getInstructionIsLoading);

    this.authState$ = this.userService.user$;

    this.authState$.pipe(
      tap(value => {
        if (value.role === 'administrator') {
          this.userValState = 4;
        } else if (value.role === 'staff') {
          this.userValState = 3;
        } else if (value.role === 'coordinator') {
          this.userValState = 2;
        } else if (value.role === 'guide') {
          this.userValState = 1;
        } else {
          this.userValState = 0;
        }
      })
    ).subscribe();

    this.formInstruction$ = this.instructionId$.pipe(
      flatMap(id => this.store.pipe(
        select(getInstructionById(id)),
        tap(instruction => {
          if (!instruction) {
            this.store.dispatch(new RequestInstruction({id}));
          }
        })
        )
      )
    );

    this.formState$ = this.store.select(selectStatesState);

    this.eventIds$ = this.formInstruction$.pipe(
      map(instruction => [instruction.instructionId, ...instruction.meetingIds]),
      tap(instruction => console.log("EventIds", instruction))
    );

    this.events$ = this.eventIds$.pipe(
      flatMap(eventIds => this.store.select(getEventsByIds(eventIds))),
      tap(eventIds => console.log("EventData", eventIds)),
      // tap(instruction => {
      //       //   for (let el in instruction) {
      //       //     this.eventArray.push(this.eventForm);
      //       //   }
      //       // }),
      tap(eventIds => {
        for (let el in eventIds) {
          console.log("ForEventIds", eventIds[el].id);
          this.title.setValue(eventIds[el].title);
          this.name.setValue(eventIds[el].name);
          this.description.setValue(eventIds[el].description);
          if (eventIds[el].startDate !== null) this.startDate.setValue(eventIds[el].startDate);
          this.startTime.setValue(eventIds[el].startTime);
          this.approximateId.setValue(eventIds[el].approximateId);
          if (eventIds[el].endDate !== null) this.endDate.setValue(eventIds[el].endDate);
          this.endTime.setValue(eventIds[el].endTime);
          this.rendevous.setValue(eventIds[el].rendezvous);
          this.location.setValue(eventIds[el].location);

          this.eventArray.push(this.eventForm)
        }
      }),
      tap(eventIds => {console.log("EventArray", this.eventArray.value)}),
      tap(eventIds => {
        for (let el = 0; el < eventIds.length; el++) {
          let dateData: Tour = {
              type: eventIds[el].id, sdate: eventIds[el].startDate, stime: eventIds[el].startTime,
              edate: eventIds[el].endDate, etime: eventIds[el].endTime,
              title: eventIds[el].title, name: eventIds[el].name, location: eventIds[el].location
          };
          this.tours.push(dateData);
        }
      })
    );

    // this.instructionForm.controls['service'].valueChanges.subscribe(
    //   (selectedValue) => {
    //     console.log("Service",selectedValue);
    //     console.log("Time",this.instructionForm.get('time').value);
    //   }
    // );

    // this.formState$.pipe(
    //   tap((state:State) => console.log("formState",state)),
    //   map(instruction => instruction.guideId)
    // ).subscribe();

    // this.formInstruction$.pipe(
    //   tap((instruction:Instruction) => console.log("formInstruction",instruction)),
    //   map(instruction => instruction.guideId)
    // ).subscribe();

    this.formInstruction$.subscribe((instruction: Instruction) => {
      if (instruction !== undefined) {
        this.instructionForm.setValue({
          id: instruction.id,
          reference: instruction.reference,
          guideId: instruction.guideId,
          teamIds: instruction.teamIds,
          topicId: instruction.topicId,
          lowEmissionAdventure: instruction.lowEmissionAdventure,
          ladiesOnly: instruction.ladiesOnly,
          isSpecial: instruction.isSpecial,
          categoryId: instruction.categoryId,
          qualificationIds: instruction.qualificationIds,
          preconditions: instruction.preconditions,
          equipmentIds: instruction.equipmentIds,
          miscEquipment: instruction.miscEquipment,
          equipmentService: instruction.equipmentService,
          admission: instruction.admission,
          advances: instruction.advances,
          advancesInfo: instruction.advancesInfo,
          extraCharges: instruction.extraCharges,
          extraChargesInfo: instruction.extraChargesInfo,
          minQuantity: instruction.minQuantity,
          maxQuantity: instruction.maxQuantity,
          curQuantity: instruction.curQuantity,
          stateId: instruction.stateId,
          instructionId: instruction.instructionId,
          meetingIds: instruction.meetingIds
            });
      } else {
        this.instructionForm.setValue({
          id: '',
          reference: '',
          guideId: '',
          teamIds: '',
          topicId: '',
          lowEmissionAdventure: '',
          ladiesOnly: '',
          isSpecial: '',
          categoryId: '',
          qualificationIds: '',
          preconditions: '',
          equipmentIds: '',
          miscEquipment: '',
          equipmentService: '',
          admission: '',
          advances: '',
          advancesInfo: '',
          extraCharges: '',
          extraChargesInfo: '',
          minQuantity: '',
          maxQuantity: '',
          curQuantity: '',
          stateId: '',
          instructionId: '',
          meetingIds: ''
        });
      }
    });

    // this.instructionForm.controls['multisingle'].valueChanges.subscribe(
    //   (selectedValue) => {
    //     console.log("MulitSingle",selectedValue);
    //   }
    // )
  }

  ngOnDestroy(): void {}

  onRowSelect(event) {
    console.log("Event - Type",event.data.type);
    this.display = true;

    this.event$ = this.store.select(getEventById(event.data.type));
    console.log("EventObservable", this.event$);
  }

}
