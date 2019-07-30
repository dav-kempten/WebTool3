import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {Observable, Subject} from 'rxjs';
import {InstructionSummary} from '../../model/instruction';
import {getInstructionSummaries} from '../../core/store/instruction-summary.selectors';
import {RequestInstructionSummaries} from '../../core/store/instruction-summary.actions';
import {flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {MenuItem} from 'primeng/api';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from "../../core/store/value.actions";
import {Instruction} from "../../core/store/instruction.model";
import {FormControl, FormGroup} from "@angular/forms";
import {eventGroupFactory, instructionGroupFactory} from "../../core/factories";
import {Event} from "../../model/event";

@Component({
  selector: 'avk-instruction-list',
  templateUrl: './instruction-list.component.html',
  styleUrls: ['./instruction-list.component.css']
})
export class InstructionListComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  instructions$: Observable<InstructionSummary[]>;
  activeItem$: Observable<MenuItem>;
  display: boolean = false;

  instruction: Instruction = {
    id: 0, // InstructionId
    reference: "",
    guideId: 0, // NameId
    teamIds: [], // NameId
    topicId: 0, // TopicId
    instructionId: 0, // EventId
    meetingIds: [], // EventId
    lowEmissionAdventure: false,
    ladiesOnly: false,
    isSpecial: false,
    categoryId: null,
    qualificationIds: [], // QualificationId
    preconditions: "",
    equipmentIds: [], // EquipmentId
    miscEquipment: "",
    equipmentService: false,
    admission: 0, // Decimal
    advances: 0, // Decimal
    advancesInfo: "",
    extraCharges: 0, // Decimal
    extraChargesInfo: "",
    minQuantity: 0,
    maxQuantity: 0,
    curQuantity : 0,
    stateId: 0,
  };

  event: Event = {
    id: 0,
    title: "",
    name: "",
    description: "",
    startDate: "", // date
    startTime: null, // time
    approximateId: null,
    endDate: null, // date
    endTime: null, // time
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

  instructionGroup = instructionGroupFactory(this.instruction);
  eventGroup = eventGroupFactory(this.event);

  menuItems: MenuItem[] = [
    {label: 'Alle Kurse', routerLink: ['/instructions']},
    {label: 'Kletterschule', url: '/instructions#indoor'},
    {label: 'Sommer Kurse', url: '/instructions#summer'},
    {label: 'Winter Kurse', url: '/instructions#winter'},
  ];

  constructor(private store: Store<AppState>, private router: Router) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
  }

  ngOnInit() {
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
          case 'indoor':
            return this.menuItems[1];
          case 'summer':
            return this.menuItems[2];
          case 'winter':
            return this.menuItems[3];
          default:
            return this.menuItems[0];
        }
      }),
      publishReplay(1),
      refCount()
    );

    this.instructions$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      flatMap( part =>
        this.store.pipe(
          select(getInstructionSummaries),
          tap(instructions => {
            if (!instructions || !instructions.length) {
              this.store.dispatch(new RequestInstructionSummaries());
            }
          }),
          map(instructions =>
            instructions.filter(instruction =>
              (part === 'winter' && instruction.winter) ||
              (part === 'summer' && instruction.summer) ||
              (part === 'indoor' && instruction.indoor) ||
              !part
            )
          )
        )
      ),
      publishReplay(1),
      refCount()
    );

    this.part$.subscribe();
    this.activeItem$.subscribe();
    this.instructions$.subscribe();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  selectInstruction(instruction): void {
    this.router.navigate(['instructions', instruction.id]);
  }

  handleClick() {
    this.display = true;
    console.log("this.display: ", this.display);
  }

  confirmClick() {
    console.log(this.instructionGroup.value);
    console.log(this.eventGroup.value);
    // console.log("I'm a confirm click!");
  }
}
