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
import {Dropdown} from 'primeng/dropdown';
import {BehaviorSubject, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {Collective} from '../../model/value';
import {stateValidator} from '../dropdown/dropdown.component';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {getCollectives} from '../store/value.selectors';
import {delay, flatMap, map, publishReplay, refCount, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'avk-collectiveselect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CollectiveselectComponent),
      multi: true
    }
  ],
  templateUrl: './collectiveselect.component.html',
  styleUrls: ['./collectiveselect.component.css']
})
export class CollectiveselectComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;

  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  private destroySubject = new Subject<void>();
  private collectiveSet = new BehaviorSubject<Collective[]>(null);

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<Collective[]>;
  formStateComponent$: Observable<Collective[]>;

  readonly = false;
  editable = false;

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set editAble(value: boolean) {
    this.editable = value;
  }

  @Input()
  set setCollective(value: Collective[]) {
    this.collectiveSet.next(value);
  }

  OnChangeWrapper(onChange: (stateIn) => void): (stateOut: Collective) => void {
    return ((state: Collective): void => {
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
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
  }

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    this.formState$ = this.store.select(getCollectives);

    this.formStateComponent$ = this.formState$.pipe(
      takeUntil(this.destroySubject),
      flatMap(collectives => this.collectiveSet.pipe(
        takeUntil(this.destroySubject),
        map(manCollectives => {
          return this.preSetCollective(collectives, manCollectives);
        })
      )),
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

  preSetCollective(collectiveArray: Collective[], codes?: Collective[]): Collective[] {
    if (codes !== undefined && codes !== null && codes.length > 0) {
      return collectiveArray.filter(val => codes.includes(val));
    } else {
      return collectiveArray;
    }
  }

}
