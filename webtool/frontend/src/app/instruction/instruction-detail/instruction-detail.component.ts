import {Observable} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {FormControl, FormGroup} from "@angular/forms";
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
import {getEventsByIds} from "../../core/store/event.selectors";
import {Event} from '../../model/event';

interface Tour {
  type;
  sdate;
  stime;
  edate;
  etime;
  shorttitle;
  longtitle;
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

  formState$: Observable<State>;
  authState$: Observable<User>;

  guide = new FormControl(undefined);
  team = new FormControl([]);
  costs = new FormControl('');
  revenue = new FormControl('');
  description = new FormControl('');
  notes = new FormControl('');
  bookingnr = new FormControl('');
  status = new FormControl('');
  concept = new FormControl('');
  shorttitle = new FormControl('');
  longtitle = new FormControl('');
  equipment = new FormControl('');
  requirement = new FormControl('');
  numbermembermin = new FormControl('');
  numbermembermax = new FormControl('');
  distance = new FormControl('');
  service = new FormControl('');
  tourcosts = new FormControl('');
  costsctr = new FormControl('');
  costsname = new FormControl('');
  extracosts = new FormControl('');
  deposit = new FormControl('');
  memberfee = new FormControl('');
  startdate = new FormControl('');
  enddate = new FormControl('');
  datetype = new FormControl('');
  location = new FormControl('');
  multisingle = new FormControl('');
  approximate = new FormControl('');
  time = new FormControl('');
  meetingIds = new FormControl('');

  instructionForm = new FormGroup({
    guide: this.guide,
    team: this.team,
    costs: this.costs,
    revenue: this.revenue,
    description: this.description,
    notes: this.notes,
    bookingnr: this.bookingnr,
    status: this.status,
    concept: this.concept,
    shorttitle: this.shorttitle,
    longtitle: this.longtitle,
    equipment: this.equipment,
    requirement: this.requirement,
    numbermembermin: this.numbermembermin,
    numbermembermax: this.numbermembermax,
    distance: this.distance,
    service: this.service,
    costsctr: this.costsctr,
    tourcosts: this.tourcosts,
    costsname: this.costsname,
    extracosts: this.extracosts,
    deposit: this.deposit,
    memberfee: this.memberfee,
    startdate: this.startdate,
    enddate: this.enddate,
    datetype: this.datetype,
    location: this.location,
    multisingle: this.multisingle,
    approximate: this.approximate,
    time: this.time,
    meetingIds: this.meetingIds
  });

  tours: Tour[] = [];
  totalcostsTable: Costs[] = [];

  userValState: number = 0;

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
      tap(instruction => console.log("EventInstruction", instruction)),
    );

    this.events$ = this.eventIds$.pipe(
      flatMap(eventIds => this.store.select(getEventsByIds(eventIds))),
      tap(eventIds => console.log("EventIds", eventIds)),
      tap(eventIds => {
          if (eventIds[0].startDate !== null) this.startdate.setValue(eventIds[0].startDate);
          if (eventIds[0].endDate !== null) this.enddate.setValue(eventIds[0].endDate);
          this.shorttitle.setValue(eventIds[0].title);
          this.longtitle.setValue(eventIds[0].name);
          this.location.setValue(eventIds[0].location);
          this.approximate.setValue(eventIds[0].approximateId);
          this.time.setValue(eventIds[0].startTime);
          this.description.setValue(eventIds[0].description);
      }),
      tap(eventIds => {
        for (let el = 1; el < eventIds.length; el++) {
          let dateData: Tour = {
              type: eventIds[el].id, sdate: eventIds[el].startDate, stime: eventIds[el].startTime,
              edate: eventIds[el].endDate, etime: eventIds[el].endTime,
              shorttitle: eventIds[el].title, longtitle: eventIds[el].name, location: eventIds[el].location
          };
          this.tours.push(dateData);
        }
      }),
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
          guide: instruction.guideId,
          team: instruction.teamIds,
          costs: '',
          revenue: '',
          description: instruction.advancesInfo,
          notes: '',
          bookingnr: instruction.reference,
          status: instruction.stateId,
          concept: instruction.topicId,
          shorttitle: '',
          longtitle: '',
          equipment: instruction.equipmentIds,
          requirement: instruction.qualificationIds,
          numbermembermin: instruction.minQuantity,
          numbermembermax: instruction.maxQuantity,
          distance: '',
          service: instruction.equipmentService,
          costsctr: 0,
          tourcosts: '',
          costsname: '',
          extracosts: '',
          deposit: '',
          memberfee: instruction.extraCharges,
          startdate: '',
          enddate: '',
          datetype: '',
          location: '',
          multisingle: (instruction.meetingIds.length > 0),
          approximate: '',
          time: '',
          meetingIds: instruction.meetingIds
        });
        console.log("MeetingsIdsLength", !(instruction.meetingIds.length > 0));
      } else {
        this.instructionForm.setValue({
          guide: '',
          team: '',
          costs: '',
          revenue: '',
          description: '',
          notes: '',
          bookingnr: '',
          status: '',
          concept: '',
          shorttitle: '',
          longtitle: '',
          equipment: '',
          requirement: '',
          numbermembermin: '',
          numbermembermax: '',
          distance: '',
          service: '',
          costsctr: 0,
          tourcosts: '',
          costsname: '',
          extracosts: '',
          deposit: '',
          memberfee: '',
          startdate: '',
          enddate: '',
          datetype: '',
          location: '',
          multisingle: '',
          approximate: '',
          time: '',
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

  getTourCosts(): void {
    if (this.costsname.value !== '' && this.tourcosts.value !== '') {
      /* increasing counter for each cost instance */
      let ctr = this.costsctr.value;
      this.costsctr.setValue(++ctr);

      /* list input-data directly on website */
      let varCost: Costs = {pos: this.costsctr.value, betrag: this.tourcosts.value, beschreibung: this.costsname.value};
      this.totalcostsTable.push(varCost);
    }
  }

  getDateData(): void {
    if (this.datetype.value !== '' && this.startdate.value !== '' && this.enddate.value !== '' && this.location.value !== '') {
      let dateData: Tour = {
        type: this.datetype.value, sdate: this.startdate.value, stime: "",
        edate: this.enddate.value, etime: "", shorttitle: "", longtitle: "", location: this.location.value
      };

      this.tours.push(dateData);
    }
  }

}
