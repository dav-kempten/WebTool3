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
import {ControlValueAccessor, FormControl, FormControlName, FormGroup, NG_VALUE_ACCESSOR} from "@angular/forms";
import {ReplaySubject, Subscription} from "rxjs";
import {delay} from "rxjs/operators";


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

  equipment: SelectItem[];
  requirement: SelectItem[];
  choiceString: string = "requirement";

  @Input()
  set choice(value: string) {
    this.choiceControl.setValue(value);
    if (!value) {
      this.choiceControl.setValue("requirement")
    }
  }

  @Input() label = '';

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
    }
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

  ngOnInit(): void {
    this.equipment = [
      {label: 'Gletscher', value: ['Schuhe', 'Regenjacke', 'Steigeisen']},
      {label: 'Klettern', value: ['Schuhe', 'Seil', 'Helm']},
      {label: 'Mountainbiken', value: ['Schuhe', 'Fahrrad', 'Helm']}
    ];
    this.requirement = [
      {label: "Grundkurs Alpin", value: ""}, {label: "Grundkurs Klettern", value: ""},
      {label: "Vorstiegsschein", value: ""}, {label: "Grundkurs Hochtouren", value: ""}
    ];
  }

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
