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
  NG_VALUE_ACCESSOR, ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {Dropdown} from 'primeng/primeng';
import {BehaviorSubject, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {Qualification as RawQualification} from '../../model/value';
import {State as QualificationState} from '../store/qualification.reducer';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {getQualificationState} from '../store/value.selectors';
import {delay, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {UserQualification} from '../../model/qualification';
import {getUserQualificationByIds} from '../store/userqualification.selectors';

@Component({
  selector: 'avk-userretrainingselect',
  templateUrl: './userretrainingselect.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UserretrainingselectComponent),
      multi: true
    }
  ],
  styleUrls: ['./userretrainingselect.component.css']
})
export class UserretrainingselectComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  private destroySubject = new Subject<void>();
  userQualificationSubject = new BehaviorSubject<UserQualification[]>(undefined);

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<UserQualification[]>;

  readonly = false; /* init of readonly in guide component */
  userqualification: number[] = [];

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set userQualifications(values: number[]) {
    values.forEach(value => this.userqualification.push(value));
    console.log(this.userqualification);
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: UserQualification[] = new Array(1).fill({id: 0, qualification: '---', aspirant: false, year: 0, note: ''});

  OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawQualification) => void {
    return ((state: RawQualification): void => {
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

  writeValue(qualificationId): void {
    const qualification = this.status.find(i => i.id === qualificationId);

    this.delegatedMethodCalls.next(accessor => accessor.writeValue(qualification));
  }

  constructor(private store: Store<AppState>) { }

  ngOnInit() {

    this.formState$ = this.store.select(getUserQualificationByIds(this.userqualification));

    this.formState$.pipe(
      takeUntil(this.destroySubject),
      tap( (state) => {
        Object.keys(state).forEach( key => {
          this.status.push(state[key]);
        });
        this.userQualificationSubject.next(this.status);
      }),
      // shareReplay(),
      publishReplay(1),
      refCount()
    ).subscribe();
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
