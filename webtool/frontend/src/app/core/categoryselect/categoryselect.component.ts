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
  FormArray,
  FormControl,
  FormControlName,
  FormGroup,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {Dropdown} from 'primeng/primeng';
import {BehaviorSubject, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {stateValidator} from '../dropdown/dropdown.component';
import {State as CategoryState} from '../store/category.reducer';
import {Category as RawCategory} from '../../model/value';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {getCategoryState} from '../store/value.selectors';
import {delay, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';

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
export class CategoryselectComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;
  private destroySubject = new Subject<void>();
  private categorySubject = new BehaviorSubject<FormArray>(undefined);
  private categoryGroup$: Observable<FormArray> = this.categorySubject.asObservable();

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<CategoryState>;
  formStateComponent$: Observable<CategoryState>;

  readonly = false;
  editable = false;

  topicKeyword = '';

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set editAble(value: boolean) {
    this.editable = value;
  }

  @Input()
  set instructionSpecific(value: string) {
    this.topicKeyword = value;
    if (this.status.length > 1 && this.categorySubject.value !== undefined) {
      this.filterBySeason(this.status, this.topicKeyword);
    }
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawCategory[] = new Array(1).fill({id: 0, code: null, name: 'Kategorie', tour: false,
    talk: false, instruction: false, collective: false, winter: true, summer: true, indoor: true});


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

  constructor(private store: Store<AppState>) { }

  ngOnInit(): void {
    this.formState$ = this.store.select(getCategoryState);

    this.formStateComponent$ = this.formState$.pipe(
      takeUntil(this.destroySubject),
      tap( state => {
        const categoryFormArray = new FormArray([categoryGroupFactory(this.status[0])]);
        if (state.ids.length === 0) {
          this.categorySubject.next(categoryFormArray);
        } else {
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
              indoor: state.entities[key].indoor
            };
            this.status.push(statePush);
            categoryFormArray.push(categoryGroupFactory(statePush));
          }
          this.filterBySeason(categoryFormArray.value, this.topicKeyword);
        }
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
    this.categorySubject.complete();
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.choiceControl.setValue(this.formControl.value);
  }

  filterBySeason(categoryArray: RawCategory[], topicKeyword: string): void {
    const categoryFormArray = new FormArray([]);
    switch (topicKeyword) {
      case 'indoor': {
        for (const idxCategory in categoryArray) {
          if (categoryArray[idxCategory].indoor === true) {
            categoryFormArray.push(categoryGroupFactory(categoryArray[idxCategory]));
          }
        }
        break;
      }
      case 'summer': {
        for (const idxCategory in categoryArray) {
          if (categoryArray[idxCategory].summer === true) {
            categoryFormArray.push(categoryGroupFactory(categoryArray[idxCategory]));
          }
        }
        break;
      }
      case 'winter': {
        for (const idxCategory in categoryArray) {
          if (categoryArray[idxCategory].winter === true) {
            categoryFormArray.push(categoryGroupFactory(categoryArray[idxCategory]));
          }
        }
        break;
      }
      default: {
        for (const idxCategory in categoryArray) {
            categoryFormArray.push(categoryGroupFactory(categoryArray[idxCategory]));
        }
        break;
      }
    }
    this.categorySubject.next(categoryFormArray);
  }
}

function categoryGroupFactory(category: RawCategory): FormGroup {
  return new FormGroup({
    id: new FormControl(category.id),
    code: new FormControl(category.code),
    name: new FormControl(category.name),
    tour: new FormControl(category.tour),
    talk: new FormControl(category.talk),
    instruction: new FormControl(category.instruction),
    collective: new FormControl(category.collective),
    winter: new FormControl(category.winter),
    summer: new FormControl(category.summer),
    indoor: new FormControl(category.indoor),
  });
}
