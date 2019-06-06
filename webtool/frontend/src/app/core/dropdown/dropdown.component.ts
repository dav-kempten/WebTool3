import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {SelectItem} from "primeng/api";
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ValidationErrors, ValidatorFn
} from "@angular/forms";
import {Dropdown} from "primeng/primeng";
import {ReplaySubject, Subscription} from "rxjs";
import {delay} from "rxjs/operators";

@Component({
  selector: 'avk-dropdown',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true
    }
  ],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css']
})
export class DropdownComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor  {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: SelectItem[];

  OnChangeWrapper(onChange: (stateOld: string) => void): (stateNew : string) => void {
    return ((stateNew:string): void => {
      this.formControl.setValue(stateNew);
      this.choiceControl.setValue(stateNew);
      onChange(stateNew);
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

  writeValue(state: string): void {
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(state));
  }

  constructor() {
    this.status = [
      {label: 'Bearbeitungsstatus', value: null},
      {label: 'In Arbeit', value: 1},
      {label: 'Fertig', value: 2},
      {label: 'Geprüft', value: 3}
    ];
  }

  ngOnInit(): void {
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

export const stateValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const choice: string = group.get('choice').value;
  const originalControl: FormControl = group.get('original').value;

  console.log(choice);
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
