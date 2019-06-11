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
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {Dropdown} from 'primeng/primeng';
import {Observable, ReplaySubject, Subscription} from 'rxjs';
import {delay, tap} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {ValuesRequested} from '../store/value.actions';
import {selectStatesState} from '../store/value.selectors';
import {State as StateState} from '../store/state.reducer';
import {State as RawState} from '../../model/value';

@Component({
  selector: 'avk-dropdown',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true
    }
  ],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css']
})
export class DropdownComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor  {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<StateState>;

  readonly = false; /* init of readonly in guide component */

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawState[] = new Array(1).fill({id: 0, state: 'Bearbeitungsstand', description: null});


  OnChangeWrapper(onChange: (stateIn) => void): (stateOut: StateState) => void {
    return ((state: StateState): void => {
      this.formControl.setValue(state);
      this.choiceControl.setValue(state);
      onChange(state);
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
    if ((typeof stateId === 'number') && (stateId <= this.status.length)) {
      stateId = this.status[stateId];
    }
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
  }

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new ValuesRequested());
  }

  ngOnInit(): void {

    this.formState$ = this.store.select(selectStatesState);

    this.formState$.pipe(
      tap( (state) => {
        for (const key in state.entities) {
          const statePush: RawState = {
            id: state.entities[key].id,
            state: state.entities[key].state,
            description: state.entities[key].description};
          this.status.push(statePush);
        }
      })
    ).subscribe().unsubscribe();
  }


  ngAfterViewInit(): void {
    this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0),
    ).subscribe(fn => fn(this.dropdown));
  }

  ngOnDestroy(): void {
    if (this.delegatedMethodsSubscription) {
      this.delegatedMethodsSubscription.unsubscribe();
    }
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.choiceControl.setValue(this.formControl.value);
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
