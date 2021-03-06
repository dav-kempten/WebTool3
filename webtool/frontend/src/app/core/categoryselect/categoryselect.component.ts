import {Component, ContentChild, forwardRef, Input, OnInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormControl, FormControlName, FormGroup, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Dropdown} from 'primeng/primeng';
import {Observable, ReplaySubject, Subscription} from 'rxjs';
import {stateValidator} from '../dropdown/dropdown.component';
import {State as CategoryState} from '../store/category.reducer';
import {Category as RawCategory} from '../../model/value';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {ValuesRequested} from '../store/value.actions';
import {getCategoryState} from '../store/value.selectors';
import {delay, tap} from 'rxjs/operators';

@Component({
  selector: 'avk-categoryselect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryselectComponent),
      multi: true
    }
  ],
  templateUrl: './categoryselect.component.html',
  styleUrls: ['./categoryselect.component.css']
})
export class CategoryselectComponent implements OnInit {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<CategoryState>;

  readonly = false; /* init of readonly in guide component */
  editable = false;

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set editAble(value: boolean) {
    this.editable = value;
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawCategory[] = new Array(1).fill({id: 0, code: null, name: 'Kategorie', tour: false,
    talk: false, instruction: false, collective: false, winter: false, summer: false, indoor: false});


  OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawCategory) => void {
    return ((state: RawCategory): void => {
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
          stateId = this.status[el];
        }
      }
    }
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
  }

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new ValuesRequested());
  }

  ngOnInit(): void {

    this.formState$ = this.store.select(getCategoryState);

    this.formState$.pipe(
      tap( (state) => {
        for (const key in state.entities) {
          const statePush: RawCategory = {
            id: state.entities[key].id,
            code: state.entities[key].code,
            name: state.entities[key].name,
            tour: state.entities[key].tour,
            talk: state.entities[key].talk,
            instruction: state.entities[key].instruction,
            collective: state.entities[key].collective,
            winter: state.entities[key].winter,
            summer: state.entities[key].summer,
            indoor: state.entities[key].indoor};
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
