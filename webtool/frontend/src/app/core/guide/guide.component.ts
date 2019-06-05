import {ReplaySubject, Subscription, of} from 'rxjs';
import {map, switchMap, filter, delay} from 'rxjs/operators';
import {
  Component, Input, Output,
  OnInit, OnDestroy, AfterContentInit, AfterViewInit,
  ViewChild, ContentChild, forwardRef,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR,
  FormGroup, FormControl, FormControlName,
  ValidationErrors, ValidatorFn
} from '@angular/forms';
import {AppState} from '../../app.state';
import {Name as APIName, NameList as APINameList} from '../../model/name';
import {getNameById, getNameList} from '../store/name.selectors';
import {Name, NameList} from '../store/name.model';
import {AutoComplete} from 'primeng/autocomplete';

@Component({
  selector: 'avk-guide',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GuideComponent),
      multi: true
    }
  ],
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.css'],
})
export class GuideComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(AutoComplete) autoComplete: AutoComplete;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  @Input() id = 'guide';
  @Input() label = 'Guide';

  @Input()
  set required(value: boolean) {
    this.isRequired = value;
    this.nameIsRequired.setValue(value);
  }

  suggestions: NameList;

  originalControl = new FormControl(null);
  name = new FormControl('');
  nameIsRequired = new FormControl(false);
  team = new FormControl([]);
  group = new FormGroup({
    original: this.originalControl,
    name: this.name,
    nameIsRequired: this.nameIsRequired,
    team: this.team
  }, [nameValidator]);

  @Output() isRequired: boolean;

  @Input()
  set nameIdList(value: number[])  {
      this.team.setValue(value);
  }

  constructor(private store: Store<AppState>) {}

  filterSuggestions(event) {
    const query: string = event.query.toLocaleLowerCase();
    const teamIds = new Set(this.team.value as number[]);

    this.store.select(getNameList).subscribe(
      (nameList: APINameList): void => {
        if (!this.formControl.value) {
          this.suggestions = nameList.map(
            (name: APIName): Name => ({
              name: `${name.lastName} ${name.firstName}`,
              id: name.id
            })
          ).filter((name: Name): boolean =>
            (name.name.toLocaleLowerCase().indexOf(query) === 0) &&
            (!teamIds.has(name.id))
          );
        } else {
          this.suggestions = [];
        }
      }
    ).unsubscribe();
  }

  OnChangeWrapper(onChange: (nameId: number) => void): (nameList: NameList) => void {
    return ((nameList: NameList): void => {
      const nameId = (!!nameList && !!nameList.length) ? nameList[0].id : undefined;
      this.formControl.setValue(nameId);
      this.name.setValue(nameId);
      onChange(nameId);
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

  writeValue(nameId: number): void {
    let nameList: NameList = [];
    of(nameId).pipe(
      filter(id => typeof id === 'number'),
      switchMap(id => this.store.select(getNameById(id))),
      filter((apiName: APIName): boolean => !!apiName && !!Object.keys(apiName).length),
      map((apiName: APIName): NameList => [
        {
          name: `${apiName.lastName} ${apiName.firstName}`,
          id: apiName.id
        }
      ])
    ).subscribe(nameIds => nameList = nameIds).unsubscribe();
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(nameList));
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0)
    ).subscribe(fn => fn(this.autoComplete));
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.name.setValue(this.formControl.value);
  }

  ngOnDestroy(): void {
    if (this.delegatedMethodsSubscription) {
      this.delegatedMethodsSubscription.unsubscribe();
    }
  }

}

const nameValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const nameId: number = group.get('name').value;
  const nameIsRequired: boolean = group.get('nameIsRequired').value;
  const nameIds = new Set(group.get('team').value as number[]);
  const originalControl: FormControl = group.get('original').value;

  const error: ValidationErrors = {invalidName: {value: nameId}};

  const valid = (
    ((!!nameId && !nameIsRequired) || (!!nameId && nameIsRequired) || (!nameId && !nameIsRequired)) &&
    (!nameId && !nameIds.size || !!nameId && !nameIds.size || !!nameId && !nameIds.has(nameId))
  );

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
