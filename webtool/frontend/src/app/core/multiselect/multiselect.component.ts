import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild, forwardRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {SelectItem} from "primeng/api";
import {MultiSelect} from "primeng/primeng";
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroup,
  NG_VALUE_ACCESSOR, ValidationErrors,
  ValidatorFn
} from "@angular/forms";
import {ReplaySubject, Subscription} from "rxjs";
import {delay} from "rxjs/operators";


const equipment = [
  {label: 'Gletscher', value: ['Schuhe', 'Regenjacke', 'Steigeisen']},
  {label: 'Klettern', value: ['Schuhe', 'Seil', 'Helm']},
  {label: 'Mountainbiken', value: ['Schuhe', 'Fahrrad', 'Helm']}
];

const requirement = [
  {label: "Grundkurs Alpin", value: ""}, {label: "Grundkurs Klettern", value: ""},
  {label: "Vorstiegsschein", value: ""}, {label: "Grundkurs Hochtouren", value: ""}
];


@Component({
  selector: 'avk-multiselect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiselectComponent),
      multi: true
    }
  ],
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.css']
})
export class MultiselectComponent implements OnInit, AfterViewInit, OnDestroy, AfterContentInit, ControlValueAccessor {

  @ViewChild(MultiSelect) multiselect: MultiSelect;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  choiceArray: SelectItem[];

  @Input()
  set choice(value: string) {
    this.choiceControl.setValue(value);
    if (value === "requirement") {
      this.choiceArray = [...requirement];
    }
    else if (value === "equipment") {
      this.choiceArray = [...equipment];
    }
    else {
      this.choiceControl.setValue("requirement");
      this.choiceArray = [...requirement];
    }
  }

  @Input() label = '';

  readonly: boolean = false; /* init of readonly in guide component */

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  originalControl = new FormControl(null);
  choiceControl = new FormControl(null);
  labelControl = new FormControl('');
  choiceValueControl = new FormControl('');


  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
      label: this.labelControl,
      choicevalue: this.choiceValueControl,
    }, [multiselectValidator]
  );

  OnChangeWrapper(onChange: (choiceNew: string) => void): (choiceOld: string) => void {
    return ((choiceOld): void => {
      const choiceNew = choiceOld;
      this.formControl.setValue(choiceNew);
      this.choiceValueControl.setValue(choiceNew);
      onChange(choiceNew);
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

  writeValue(choice: string): void {
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(choice));
  }

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
     this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0),
    ).subscribe(fn => fn(this.multiselect));
  }

  ngOnDestroy(): void {
    if (this.delegatedMethodsSubscription) {
      this.delegatedMethodsSubscription.unsubscribe();
    }
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.choiceValueControl.setValue(this.formControl.value);
    this.labelControl.setValue(this.label);
  }
}

export const multiselectValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const choice: string = group.get('choice').value;
  const choiceValue: any[] = group.get('choicevalue').value;
  const originalControl: FormControl = group.get('original').value;

  // console.log(choice, choiceValue);

  const error: ValidationErrors = {invalidSelect: {value: choiceValue}};

  const valid = (!!choice && !!choiceValue.length);

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
