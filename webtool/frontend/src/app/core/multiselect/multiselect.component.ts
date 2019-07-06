import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {MultiSelect} from 'primeng/primeng';
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {delay, takeUntil, tap} from 'rxjs/operators';
import {ValuesRequested} from '../store/value.actions';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {Equipment as RawEquipment, Skill as RawSkill} from '../../model/value';
import {State as SkillState} from '../store/skill.reducer';
import {State as EquipState} from '../store/equipment.reducer';
import {getEquipState, getSkillState} from '../store/value.selectors';


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
  optionlabel: string;

  private destroySubject = new Subject<void>();

  formEquipState$: Observable<EquipState>;
  formSkillState$: Observable<SkillState>;

  statusEquipment: RawEquipment[] = new Array(1).fill({id: 0, code: '', name: 'Ausrüstung', description: ''});
  statusSkills: RawSkill[] = new Array(1).fill({id: 0, level: '', categoryId: '', code: 'Skills', description: ''});

  @Input()
  set choice(value: string) {
    this.choiceControl.setValue(value);
    if (value === 'requirement') {
      this.choiceArray = [...this.statusSkills];
      this.optionlabel = 'code';
    } else if (value === 'equipment') {
      this.choiceArray = [...this.statusEquipment];
      this.optionlabel = 'name';
    } else {
      this.choiceControl.setValue('requirement');
      this.choiceArray = [...this.statusSkills];
      this.optionlabel = 'code';
    }
  }

  @Input() label = '';

  readonly = false; /* init of readonly in guide component */

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

  OnChangeWrapper(onChange: (choiceNew) => void): (choiceOld) => void {
    return ((choiceOld): void => {
      const choiceNew = choiceOld;
      this.formControl.setValue(choiceNew);
      this.choiceValueControl.setValue(choiceNew);
      let choiceNewId: number[] = [];
      for (const el in choiceNew) {
        choiceNewId.push(choiceNew[el].id);
      }
      onChange(choiceNewId);
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

  writeValue(choice): void {
    if (choice.length > 0) {
      const pushArray = new Array(0);
      if (typeof(choice[0]) === 'number') {
        for (const el in choice) {
          pushArray.push(this.choiceArray[choice[el]]);
        }
      } else {
        for (const el in choice) {
          pushArray.push(choice[el]);
        }
      }
      choice = pushArray;
    }
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(choice));
  }

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new ValuesRequested());
    this.formEquipState$ = this.store.select(getEquipState);

    this.formEquipState$.pipe(
      takeUntil(this.destroySubject),
      tap((state) => {
        for (const key in state.entities) {
          const stateEquip: RawEquipment = {
            id: state.entities[key].id,
            code: state.entities[key].code,
            name: state.entities[key].name,
            description: state.entities[key].description,
          };
          this.statusEquipment.push(stateEquip);
        }
      })
    ).subscribe();

    this.formSkillState$ = this.store.select(getSkillState);

    this.formSkillState$.pipe(
      takeUntil(this.destroySubject),
      tap((state) => {
        for (const key in state.entities) {
          const stateSkill: RawSkill = {
            id: state.entities[key].id,
            level: state.entities[key].level,
            categoryId: state.entities[key].categoryId,
            code: state.entities[key].code,
            description: state.entities[key].description,
          };
          this.statusSkills.push(stateSkill);
        }
      })
    ).subscribe();
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
    this.destroySubject.next();
    this.destroySubject.complete();
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

  const error: ValidationErrors = {invalidSelect: {value: choiceValue}};

  const valid = (!!choice && !!choiceValue.length);

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
