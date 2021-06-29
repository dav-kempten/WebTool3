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
import {stateValidator} from '../dropdown/dropdown.component';
import {State as CategoryState} from '../store/category.reducer';
import {Category as RawCategory} from '../../model/value';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {getCategoryState} from '../store/value.selectors';
import {delay, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {Permission, PermissionLevel} from '../service/permission.service';

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
  categorySubject = new BehaviorSubject<RawCategory[]>(undefined);

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<CategoryState>;
  formStateComponent$: Observable<CategoryState>;

  readonly = false;
  editable = false;

  seasonKeyword = '';
  topicKeyword = '';
  isStaff = new BehaviorSubject<boolean>(true);

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set editAble(value: boolean) {
    this.editable = value;
  }

  @Input()
  set seasonSpecific(value: string) {
    this.seasonKeyword = value;
    if (this.status.length > 1 && this.categorySubject.value !== undefined) {
      this.filterBySeason(this.status, this.seasonKeyword);
    }
  }

  @Input()
  set isStaffOrAdmin(value: Permission) {
    this.isStaff.next(value.permissionLevel >= PermissionLevel.coordinator);
    /* Filter if current user is not Admin or Staff */
    if (this.status.length > 1 && this.categorySubject.value !== undefined) {
      this.filterByStatus(this.status, this.isStaff.value);
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
    },
    [stateValidator]
  );

  status: RawCategory[] = new Array(0);


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
        this.filterBySeason(this.filterByStatus(this.status, this.isStaff.value), this.seasonKeyword);
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

  filterByStatus(categoryArray: RawCategory[], isStaff: boolean): RawCategory[] {
    let categoryStatusArray = new Array(0);
    if (!isStaff) {
      for (const idxCategory in categoryArray) {
        if (!categoryArray[idxCategory].indoor) {
          categoryStatusArray.push(categoryArray[idxCategory]);
        }
      }
    } else {
      categoryStatusArray = [...categoryArray];
    }
    return categoryStatusArray;
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
