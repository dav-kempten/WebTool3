import {Component, ContentChild, forwardRef, Input, OnInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormControl, FormControlName, FormGroup, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Dropdown} from "primeng/primeng";
import {Observable, ReplaySubject, Subscription} from "rxjs";
import {State as ApproxState} from "../store/approximate.reducer";
import {Approximate as RawApprox} from "../../model/value";
import {stateValidator} from "../dropdown/dropdown.component";
import {Store} from "@ngrx/store";
import {AppState} from "../../app.state";
import {ValuesRequested} from "../store/value.actions";
import {delay, tap} from "rxjs/operators";
import {getApproxState} from "../store/value.selectors";

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
export class ApproxdropdownComponent implements OnInit {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<ApproxState>;

  readonly: boolean = false; /* init of readonly in guide component */

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  disabledState: boolean = false;

  @Input()
  set disable (value: boolean) {
    this.disabledState = value;
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawApprox[] = new Array(1).fill({id: 0, name: "Startzeit", description: null, startTime: null});

   OnChangeWrapper(onChange: (stateIn) => void): (stateOut: ApproxState) => void {
    return ((state: ApproxState): void => {
      this.formControl.setValue(state);
      this.choiceControl.setValue(state);
      onChange(state);
    })
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
    if ((typeof stateId === "number") && (stateId <= this.status.length)) {
      stateId = this.status[stateId];
    }
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
  }

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new ValuesRequested());
  }

  ngOnInit(): void {
    this.formState$ = this.store.select(getApproxState);

    this.formState$.pipe(
      tap((state) => {
        for (let key in state.entities) {
          let statePush: RawApprox = {
            id: state.entities[key].id,
            name: state.entities[key].name,
            description: state.entities[key].description,
            startTime: state.entities[key].startTime};
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

