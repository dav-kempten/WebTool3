import {combineLatest, Observable, ReplaySubject, Subscription} from 'rxjs';
import {delay, filter, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {Name} from '../../model/name';
import {getNameById, getNames, getNamesState} from '../store/name.selectors';
import {AppState} from '../../app.state';
import {AutoComplete} from 'primeng/autocomplete';
import {from} from "rxjs/internal/observable/from";

interface NameString {
  name: string;
  id: number;
}

@Component({
  selector: 'avk-team',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TeamComponent),
      multi: true
    }
  ],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css'],
})
export class TeamComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(AutoComplete) autoComplete: AutoComplete;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  @Input() id = 'team';
  @Input() label = 'Team';

  suggestions: NameString[];

  readonly = false; /* init of readonly in guide component */

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  originalControl = new FormControl(null);
  name = new FormControl(null);
  team = new FormControl([]);
  group = new FormGroup({
    original: this.originalControl,
    name: this.name,
    team: this.team
  }, [nameValidator]);

  @Input()
  set nameId(value: number) {
    this.name.setValue(value);
  }

  filterSuggestions(event) {
    const query: string = event.query.toLocaleLowerCase();
    const nameId: number = this.name.value || undefined;
    const nameIds = new Set(this.formControl.value || []);

    this.suggestions = [];
    this.store.select(getNames).pipe(
      mergeMap((names: Name[]): Observable<Name> => from(names)),
      map((name: Name): NameString => ({name: `${name.lastName} ${name.firstName}`, id: name.id})),
      filter((nameString: NameString): boolean =>
          (nameString.name.toLocaleLowerCase().indexOf(query) === 0) &&
          (nameString.id !== nameId) &&
          (!nameIds.has(nameString.id))
      )
    ).subscribe((nameString: NameString): void => void this.suggestions.push(nameString)).unsubscribe();
  }

  OnChangeWrapper(onChange: (nameIds: number[]) => void): (names: Name[]) => void {
    return ((names: Name[]): void => {
      const nameIds = names ? names.map((name: Name) => name.id) : [];
      this.formControl.setValue(nameIds);
      this.team.setValue(nameIds);
      onChange(nameIds);
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

  writeValue(nameIds: number[]): void {
    const newObj: NameString[] = [];
    from(nameIds || []).pipe(
      filter(id => typeof id === 'number'),
      switchMap(nameId => this.store.select(getNameById(nameId))),
      filter((apiName: Name): boolean => !!apiName && !!Object.keys(apiName).length),
      map((apiName: Name): NameString => ({
          name: `${apiName.lastName} ${apiName.firstName}`,
          id: apiName.id
      }))
    ).subscribe(name => newObj.push(name));
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(newObj));
  }

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0)
    ).subscribe(fn => fn(this.autoComplete));
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.team.setValue(this.formControl.value || []);
  }

  ngOnDestroy(): void {}

}

const nameValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const nameId: number = group.get('name').value;
  const nameIds: number[] = group.get('team').value || [];
  const nameIdSet = new Set(nameIds);
  const originalControl: FormControl = group.get('original').value;

  const error: ValidationErrors = {invalidName: {value: nameId}};

  const valid = !nameIdSet.has(nameId) && nameIdSet.size === nameIds.length;

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
