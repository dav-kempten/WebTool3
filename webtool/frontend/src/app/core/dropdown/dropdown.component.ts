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
import {BehaviorSubject, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {delay, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
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

  private destroySubject = new Subject<void>();
  stateSubject = new BehaviorSubject<RawState[]>(undefined);

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<StateState>;
  formStateComponent$: Observable<StateState>;

  readonly = false; /* init of readonly in guide component */
  trainerstate = false;

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @ Input()
  set trainerState(value: boolean) {
    this.trainerstate = value;
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawState[] = new Array(1).fill({id: 0, state: 'Bearbeitungsstand',
   description: null});

  OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawState) => void {
    return ((state: RawState): void => {
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
          stateId = this.status[stateId];
        }
      }
    }

    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
  }

  constructor(private store: Store<AppState>) { }

  ngOnInit(): void {

    this.formState$ = this.store.select(selectStatesState);

    this.formStateComponent$ = this.formState$.pipe(
      takeUntil(this.destroySubject),
      tap( (state) => {
        Object.keys(state.entities).forEach(key => {
          this.status.push(state.entities[key]);
        });
        if (this.trainerstate) {
          this.status = this.status.slice(0, 3);
        }
        this.stateSubject.next(this.status);
      }),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.formStateComponent$.subscribe();
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
    this.destroySubject.next();
    this.destroySubject.complete();
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

function stateGroupFactory(state: RawState): FormGroup {
  return new FormGroup({
    id: new FormControl(state.id),
    state: new FormControl(state.state),
    description: new FormControl(state.description)
  });
}
