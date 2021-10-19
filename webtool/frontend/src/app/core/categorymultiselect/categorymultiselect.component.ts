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
  NG_VALUE_ACCESSOR, ValidationErrors, ValidatorFn
} from '@angular/forms';
import {MultiSelect} from 'primeng/primeng';
import {BehaviorSubject, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {State as CategoryState} from '../store/category.reducer';
import {Category as RawCategory} from '../../model/value';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {getCategoryState} from '../store/value.selectors';
import {delay, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {CategorymultiselectPipe} from './categorymultiselect.pipe';

@Component({
  selector: 'avk-categorymultiselect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryMultiselectComponent),
      multi: true
    },
    CategorymultiselectPipe
  ],
  templateUrl: './categorymultiselect.component.html',
  styleUrls: ['./categorymultiselect.component.css']
})
export class CategoryMultiselectComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(MultiSelect) mulitselect: MultiSelect;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;
  private destroySubject = new Subject<void>();
  categorySubject = new BehaviorSubject<RawCategory[]>(undefined);

  originalControl = new FormControl(null);
  choiceControl = new FormControl(null);
  choiceValueControl = new FormControl('');

  formState$: Observable<CategoryState>;
  formStateComponent$: Observable<CategoryState>;

  readonly = false;

  seasonKeyword = '';
  topicKeyword = '';

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set seasonSpecific(value: string) {
    this.seasonKeyword = value;
    if (this.status.length > 1 && this.categorySubject.value !== undefined) {
      this.filterBySeason(this.status, this.seasonKeyword);
    }
  }

  @Input()
  set topicSpecific(value: string) {
    this.topicKeyword = value;
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
      choicevalue: this.choiceValueControl,
    },
    [multiselectValidator]
  );

  status: RawCategory[] = new Array(0);


  OnChangeWrapper(onChange: (stateIn) => void): (stateOut) => void {
    return ((state): void => {
      this.formControl.setValue(state);
      this.choiceControl.setValue(state);
      onChange(state.map(value => value.id));
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

  writeValue(categories): void {
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(this.pipe.transform(categories)));
  }

  constructor(private store: Store<AppState>, private pipe: CategorymultiselectPipe) { }

  ngOnInit(): void {
    this.formState$ = this.store.select(getCategoryState);

    this.formStateComponent$ = this.formState$.pipe(
      takeUntil(this.destroySubject),
      tap( state => {
        Object.keys(state.entities).forEach( key => {
          switch (this.topicKeyword) {
            case 'instruction': {
              if (state.entities[key].instruction) {
                this.status.push(state.entities[key]);
              }
              break;
            }
            case 'talk': {
              if (state.entities[key].talk) {
                this.status.push(state.entities[key]);
              }
              break;
            }
            case 'tour': {
              if (state.entities[key].tour) {
                this.status.push(state.entities[key]);
              }
              break;
            }
            default: {
              break;
            }
          }
        });
        this.filterBySeason(this.status, this.seasonKeyword);
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
    ).subscribe(fn => fn(this.mulitselect));
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
    this.choiceValueControl.setValue(this.formControl.value);
  }

  filterBySeason(categoryArray: RawCategory[], seasonKeyword: string): void {
    let categorySeasonArray = new Array(0);
    switch (seasonKeyword) {
      case 'indoor': {
        for (const idxCategory in categoryArray) {
          if (categoryArray[idxCategory].indoor === true) {
            categorySeasonArray.push(categoryArray[idxCategory]);
          }
        }
        break;
      }
      case 'summer': {
        for (const idxCategory in categoryArray) {
          if (categoryArray[idxCategory].summer === true) {
            categorySeasonArray.push(categoryArray[idxCategory]);
          }
        }
        break;
      }
      case 'winter': {
        for (const idxCategory in categoryArray) {
          if (categoryArray[idxCategory].winter === true) {
            categorySeasonArray.push(categoryArray[idxCategory]);
          }
        }
        break;
      }
      default: {
        categorySeasonArray = [...categoryArray];
        break;
      }
    }
    this.categorySubject.next(categorySeasonArray);
  }
}

export const multiselectValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const choice: string = group.get('choice').value;
  const choiceValue: any[] = group.get('choicevalue').value;
  const originalControl: FormControl = group.get('original').value;

  const error: ValidationErrors = {invalidSelect: {value: choiceValue}};

  const valid = (!!choice && !!choiceValue.length);

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
