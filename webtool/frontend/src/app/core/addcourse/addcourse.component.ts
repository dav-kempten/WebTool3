import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  forwardRef,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {Dropdown} from "primeng/primeng";
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  ValidatorFn
} from "@angular/forms";
import {Observable, ReplaySubject, Subject, Subscription} from "rxjs";
import {State as CategoryState} from "../store/category.reducer";
import {Category as RawCategory} from "../../model/value";
import {Store} from "@ngrx/store";
import {AppState} from "../../app.state";
import {ValuesRequested} from "../store/value.actions";
import {getCategoryState} from "../store/value.selectors";
import {delay, publishReplay, refCount, takeUntil, tap} from "rxjs/operators";
import {
  eventGroupFactory,
  instructionGroupFactory
} from "../../instruction/instruction-detail/instruction-detail.component";
import {Instruction} from "../store/instruction.model";
import {Event} from "../../model/event";

@Component({
  selector: 'avk-addcourse',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddcourseComponent),
      multi: true
    }
  ],
  templateUrl: './addcourse.component.html',
  styleUrls: ['./addcourse.component.css']
})
export class AddcourseComponent implements OnInit, AfterViewInit, AfterContentInit {

  @ViewChild(Dropdown) addcourse: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  private destroySubject = new Subject<void>();
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');
  topicId = new FormControl('');

  formState$: Observable<CategoryState>;

  display = false;
  readonly = false;
  editable = false;

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
  instruction: Instruction = {
    id: 0,
    reference: "",
    guideId: 0,
    teamIds: [],
    topicId: 0,
    instructionId: 0,
    meetingIds: [],
    lowEmissionAdventure: false,
    ladiesOnly: false,
    isSpecial: false,
    categoryId: 0,
    qualificationIds: [],
    preconditions: "",
    equipmentIds: [],
    miscEquipment: "",
    equipmentService: false,
    admission: 0,
    advances: 0,
    advancesInfo: "",
    extraCharges: 0,
    extraChargesInfo: "",
    minQuantity: 0,
    maxQuantity: 0,
    curQuantity: 0,
    stateId: 0,
  };

  eventGroup: FormGroup = eventGroupFactory(this.event);
  instructionGroup: FormGroup = instructionGroupFactory(this.instruction);


  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set editAble(value: boolean) {
    this.editable = value;
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl
    },
    [stateValidator]
  );

  status: RawCategory[] = new Array(1).fill({id: 0, code: null, name: 'Kategorie', tour: false,
    talk: false, instruction: false, collective: false, winter: false, summer: false, indoor: false});


  OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawCategory) => void {
    return ((state: RawCategory): void => {
      this.formControl.setValue(state);
      this.choiceControl.setValue(state);
      onChange(state.id);
    });
  }

  registerOnChange(fn: any): void {
    this.delegatedMethodCalls.next(accessor => accessor.registerOnChange(this.OnChangeWrapper(fn)));
  }

  registerOnTouched(fn: any): void {
    this.delegatedMethodCalls.next(accessor => accessor.registerOnTouched(fn));
  }

  setDisabledState(isDisabled: boolean): void {
    this.delegatedMethodCalls.next(accessor => accessor.setDisabledState(isDisabled));
  }

  writeValue(stateId): void {
    if (typeof stateId === 'number') {
      for (const el in this.status) {
        if (stateId === this.status[el].id) {
          stateId = this.status[el];
        }
      }
    }
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
  }

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new ValuesRequested());
  }

  ngOnInit() {

    this.formState$ = this.store.select(getCategoryState);

    // setTimeout(() => {
    //   console.log("timeout");
    // }, 500);

    this.formState$.pipe(
      takeUntil(this.destroySubject),
      tap( (state) => {
        for (const key in state.entities) {
          const statePush: RawCategory = {
            id: state.entities[key].id,
            code: state.entities[key].code,
            name: state.entities[key].name,
            tour: state.entities[key].tour,
            talk: state.entities[key].talk,
            instruction: state.entities[key].instruction,
            collective: state.entities[key].collective,
            winter: state.entities[key].winter,
            summer: state.entities[key].summer,
            indoor: state.entities[key].indoor};
          this.status.push(statePush);
        }
      }),
      publishReplay(1),
      refCount()
    ).subscribe();
  }

  ngAfterViewInit(): void {
    this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0),
    ).subscribe(fn => fn(this.addcourse));
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    if (this.delegatedMethodsSubscription) {
      this.delegatedMethodsSubscription.unsubscribe();
    }
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.choiceControl.setValue(this.formControl.value);
  }

  selectEvent(index) {
    console.log(index.value);
    this.display = true;
  }

}

export const stateValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const choice: string = group.get('choice').value;
  const originalControl: FormControl = group.get('original').value;

  const checkChoice: boolean = !!choice;

  const error: ValidationErrors = {invalidChoice: {value: choice}};

  /* Logik lässt sich je nach Bedarf verbessern. Momentan gilt alles als valid,
   * was nicht der Grundzustand ist. */
  const valid = (
    checkChoice
  );

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
