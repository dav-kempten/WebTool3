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
import {Collective as RawCollective} from '../../model/value';
import {State as CollectiveState} from '../store/collective.reducer';
import {stateValidator} from '../dropdown/dropdown.component';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {getCollectiveState} from '../store/value.selectors';
import {delay, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';

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
  collectiveSubject = new BehaviorSubject<RawCollective[]>(undefined);
  collectiveSet: any;

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<CollectiveState>;
  formStateComponent$: Observable<CollectiveState>;

  readonly = false;
  editable = false;

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set editAble(value: boolean) {
    this.editable = value;
  }

  @Input()
  set setCollective(value) {
    this.collectiveSet = value;
    if (this.status.length > 0 && this.collectiveSubject.value !== undefined) {
      this.preSetCollective(this.status, this.collectiveSet);
    }
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawCollective[] = new Array(0);


  OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawCollective) => void {
    return ((state: RawCollective): void => {
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
    if (typeof stateId === 'number' && stateId > 0) {
      for (const el in this.status) {
        if (stateId === this.status[el].id) {
          stateId = this.status[el];
        }
      }
    }
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
  }

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    this.formState$ = this.store.select(getCollectiveState);

    this.formStateComponent$ = this.formState$.pipe(
      takeUntil(this.destroySubject),
      tap( state => {
        Object.keys(state.entities).forEach( key => {
          this.status.push(state.entities[key]);
        });
        this.preSetCollective(this.status, this.collectiveSet);
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
    this.collectiveSubject.complete();
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.choiceControl.setValue(this.formControl.value);
  }

  preSetCollective(collectiveArray: RawCollective[], value): void {
    const collectiveSetArray = new Array(0);
    if (value !== null && value !== undefined) {
      for (const idxCollective in collectiveArray) {
        if (collectiveArray[idxCollective].code === value.toUpperCase()) {
          collectiveSetArray.push(collectiveArray[idxCollective]);
        }
      }
      this.collectiveSubject.next(collectiveSetArray);
    } else {
      this.collectiveSubject.next(this.status);
    }
  }

}
