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
import {ControlValueAccessor, FormControl, FormControlName, FormGroup, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Dropdown} from 'primeng/primeng';
import {Observable, ReplaySubject, Subscription} from 'rxjs';
import {State as ApproxState} from '../store/approximate.reducer';
import {Approximate as RawApprox} from '../../model/value';
import {stateValidator} from '../dropdown/dropdown.component';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {delay, tap} from 'rxjs/operators';
import {getApproxState} from '../store/value.selectors';

@Component({
  selector: 'avk-approxdropdown',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ApproxdropdownComponent),
      multi: true
    }
  ],
  templateUrl: './approxdropdown.component.html',
  styleUrls: ['./approxdropdown.component.css']
})
export class ApproxdropdownComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<ApproxState>;

  readonly = false; /* init of readonly in guide component */

  @Input()
  set readOnly(value) {
    this.readonly = !!value;
  }

  disabledState = false;

  @Input()
  set disable(value: boolean) {
    this.disabledState = value;
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawApprox[] = new Array(1).fill({id: 0, name: 'Startzeit', description: null, startTime: null});

   OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawApprox) => void {
    return ((state: RawApprox): void => {
      if ((state.id === 0)) {
        state = null;
      }
      this.formControl.setValue(state);
      this.choiceControl.setValue(state);
      state !== null ? onChange(state.id) : onChange(state);
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

  constructor(private store: Store<AppState>) {  }

  ngOnInit(): void {
    this.formState$ = this.store.select(getApproxState);

    this.formState$.pipe(
      tap((state) => {
        Object.keys(state.entities).forEach(key => {
          const statePush: RawApprox = {
            id: state.entities[key].id,
            name: state.entities[key].name,
            description: state.entities[key].description,
            startTime: state.entities[key].startTime};
          this.status.push(statePush);
        });
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

