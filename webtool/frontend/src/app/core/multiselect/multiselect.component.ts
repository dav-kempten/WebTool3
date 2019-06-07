import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild, forwardRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {SelectItem} from "primeng/api";
import {MultiSelect} from "primeng/primeng";
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  NG_VALUE_ACCESSOR, ValidationErrors,
  ValidatorFn
} from "@angular/forms";
import {Observable, ReplaySubject, Subscription} from "rxjs";
import {delay, tap} from "rxjs/operators";
import {ValuesRequested} from "../store/value.actions";
import {Store} from "@ngrx/store";
import {AppState} from "../../app.state";
import {Equipment as RawEquipment} from "../../model/value";
import {Skill as RawSkill} from "../../model/value";
import {State as SkillState} from "../store/skill.reducer";
import {State as EquipState} from "../store/equipment.reducer";
import {getEquipState, getSkillState} from "../store/value.selectors";


@Component({
  selector: 'avk-multiselect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiselectComponent),
      multi: true
    }
  ],
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.css']
})
export class MultiselectComponent implements OnInit, AfterViewInit, OnDestroy, AfterContentInit, ControlValueAccessor {

  @ViewChild(MultiSelect) multiselect: MultiSelect;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  choiceArray: any[];

  formEquipState$: Observable<EquipState>;
  formSkillState$: Observable<SkillState>;

  statusEquipment: RawEquipment[] = new Array(0);
  statusSkills: RawSkill[] = new Array(0);

  @Input()
  set choice(value: string) {
    this.choiceControl.setValue(value);
    if (value === "requirement") {
      this.choiceArray = [...this.statusSkills];
    }
    else if (value === "equipment") {
      this.choiceArray = [...this.statusEquipment];
    }
    else {
      this.choiceControl.setValue("requirement");
      this.choiceArray = [...this.statusSkills];
    }
  }

  @Input() label = '';

  readonly: boolean = false; /* init of readonly in guide component */

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  originalControl = new FormControl(null);
  choiceControl = new FormControl(null);
  labelControl = new FormControl('');
  choiceValueControl = new FormControl('');


  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
      label: this.labelControl,
      choicevalue: this.choiceValueControl,
    }, [multiselectValidator]
  );

  OnChangeWrapper(onChange: (choiceNew: string) => void): (choiceOld: string) => void {
    return ((choiceOld): void => {
      const choiceNew = choiceOld;
      this.formControl.setValue(choiceNew);
      this.choiceValueControl.setValue(choiceNew);
      onChange(choiceNew);
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

  writeValue(choice: string): void {
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(choice));
  }

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new ValuesRequested());
    this.formEquipState$ = this.store.select(getEquipState);

    this.formEquipState$.pipe(
      tap((state) => {
        for (let key in state.entities) {
          let stateEquip: RawEquipment = {
            id: state.entities[key].id,
            code: state.entities[key].code,
            name: state.entities[key].name,
            description: state.entities[key].description,
          };
          this.statusEquipment.push(stateEquip);
        }
      })
    ).subscribe().unsubscribe()

    this.formSkillState$ = this.store.select(getSkillState);

    this.formSkillState$.pipe(
      tap((state) => {
        for (let key in state.entities) {
          let stateSkill: RawSkill = {
            id: state.entities[key].id,
            level: state.entities[key].level,
            categoryId: state.entities[key].categoryId,
            code: state.entities[key].code,
            description: state.entities[key].description,
          };
          this.statusSkills.push(stateSkill);
        }
      })
    ).subscribe().unsubscribe();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
     this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0),
    ).subscribe(fn => fn(this.multiselect));
  }

  ngOnDestroy(): void {
    if (this.delegatedMethodsSubscription) {
      this.delegatedMethodsSubscription.unsubscribe();
    }
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.choiceValueControl.setValue(this.formControl.value);
    this.labelControl.setValue(this.label);
  }
}

export const multiselectValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const choice: string = group.get('choice').value;
  const choiceValue: any[] = group.get('choicevalue').value;
  const originalControl: FormControl = group.get('original').value;

  // console.log(choice, choiceValue);

  const error: ValidationErrors = {invalidSelect: {value: choiceValue}};

  const valid = (!!choice && !!choiceValue.length);

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
