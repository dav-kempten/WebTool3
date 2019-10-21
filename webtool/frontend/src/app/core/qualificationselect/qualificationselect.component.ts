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
import {Topic as RawTopic} from '../../model/value';
import {State as TopicState} from '../store/topic.reducer';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {ValuesRequested} from '../store/value.actions';
import {delay, takeUntil, tap} from 'rxjs/operators';
import {getTopicState} from '../store/value.selectors';

@Component({
  selector: 'avk-qualificationselect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QualificationselectComponent),
      multi: true
    }
  ],
  templateUrl: './qualificationselect.component.html',
  styleUrls: ['./qualificationselect.component.css']
})
export class QualificationselectComponent implements OnInit, AfterViewInit, OnDestroy, AfterContentInit, ControlValueAccessor {

  @ViewChild(MultiSelect) multiselect: MultiSelect;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  private destroySubject = new Subject<void>();

  formTopicState$: Observable<TopicState>;

  statusTopic: RawTopic[] = new Array(1).fill({id: 0, code: '', title: 'Topic', name: '', description: '',
    preconditions: '', qualificationIds: [], equipmentIds: [], miscEquipment: ''});

  readonly = false;

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  originalControl = new FormControl(null);
  choiceControl = new FormControl(null);
  choiceValueControl = new FormControl('');


  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
      choicevalue: this.choiceValueControl,
    }, [multiselectValidator]
  );

  OnChangeWrapper(onChange: (choiceNew) => void): (choiceOld) => void {
    return ((choiceOld): void => {
      const choiceNew = choiceOld;
      this.formControl.setValue(choiceNew);
      this.choiceValueControl.setValue(choiceNew);
      const choiceNewId: number[] = [];
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
      for (const el in choice) {
        if (typeof(choice[el]) === 'number') {
          for (const ele in this.statusTopic) {
            if (choice[el] === this.statusTopic[ele].id) {
              pushArray.push(this.statusTopic[ele]);
            }
          }
        } else {
          for (const elem in choice) {
            pushArray.push(choice[elem]);
          }
        }
      }
      choice = pushArray;
    }
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(choice));
  }

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new ValuesRequested());
    this.formTopicState$ = this.store.select(getTopicState);

    this.formTopicState$.pipe(
      takeUntil(this.destroySubject),
      tap((state) => {
        for (const key in state.entities) {
          const stateTopic: RawTopic = {
            id: state.entities[key].id,
            code: state.entities[key].code,
            title: state.entities[key].title,
            name: state.entities[key].name,
            description: state.entities[key].description,
            preconditions: state.entities[key].preconditions,
            qualificationIds: state.entities[key].qualificationIds,
            equipmentIds: state.entities[key].equipmentIds,
            miscEquipment: state.entities[key].miscEquipment,
          };
          this.statusTopic.push(stateTopic);
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
