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
import {BehaviorSubject, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {State as ApproxState} from '../store/approximate.reducer';
import {Approximate as RawApprox} from '../../model/value';
import {stateValidator} from '../dropdown/dropdown.component';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {delay, takeUntil, tap} from 'rxjs/operators';
import {getApproxState} from '../store/value.selectors';
import {ApproximatePipe} from './approximate.pipe';

@Component({
  selector: 'avk-approxdropdown',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ApproxdropdownComponent),
      multi: true
    },
    ApproximatePipe
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

  private destroySubject = new Subject<void>();
  stateSubject = new BehaviorSubject<RawApprox[]>(undefined);
  disableSubject = new BehaviorSubject<boolean>(false);

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<ApproxState>;
  formStateComponent$: Observable<ApproxState>;

  readonly = false; /* init of readonly in guide component */

  @Input()
  set readOnly(value) {
    this.readonly = !!value;
  }

  @Input()
  set disable(value: boolean) {
    this.disableSubject.next(value);
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawApprox[] = new Array(1).fill({id: 0, name: 'Startzeit (ca.)', description: null, startTime: null});

   OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawApprox) => void {
    return ((state: RawApprox): void => {
      this.formControl.setValue(state);
      this.choiceControl.setValue(state);
      onChange(state.id !== 0 ? state.id : null);
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
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(this.pipe.transform(stateId)));
  }

  constructor(private store: Store<AppState>, private pipe: ApproximatePipe) {  }

  ngOnInit(): void {
    this.formState$ = this.store.select(getApproxState);

    this.formStateComponent$ = this.formState$.pipe(
      takeUntil(this.destroySubject),
      tap((state) => {
        Object.keys(state.entities).forEach(key => {
          this.status.push(state.entities[key]);
        });
        this.stateSubject.next(this.status);
      })
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

