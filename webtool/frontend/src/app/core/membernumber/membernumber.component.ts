import {
  AfterContentInit, AfterViewInit,
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
  NG_VALUE_ACCESSOR, ValidationErrors,
  ValidatorFn
} from "@angular/forms";
import {ReplaySubject, Subscription} from "rxjs";
import {Spinner} from "primeng/primeng";
import {delay} from "rxjs/operators";

@Component({
  selector: 'avk-membernumber',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MembernumberComponent),
      multi: true
    }
  ],
  templateUrl: './membernumber.component.html',
  styleUrls: ['./membernumber.component.css']
})
export class MembernumberComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(Spinner) spinner: Spinner;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl = new FormControl('');
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  originalControl = new FormControl(null);
  minMemberControl = new FormControl('');
  maxMemberControl = new FormControl('');
  memberValueControl = new FormControl('');
  minIncludeControl = new FormControl(false);
  maxIncludeControl = new FormControl(false);

  group = new FormGroup({
      original: this.originalControl,
      minMember: this.minMemberControl,
      maxMember: this.maxMemberControl,
      member: this.memberValueControl,
      minInclude: this.minIncludeControl,
      maxInclude: this.maxIncludeControl
    },
    [memberValidator]
  );

  @Input()
  set minMember(value: string) {
    this.minMemberControl.setValue(value);
  }

  @Input()
  set minInclude(value: boolean) {
    this.minIncludeControl.setValue(value);
  }

  @Input()
  set maxMember(value: string) {
    this.maxMemberControl.setValue(value);
  }

  @Input()
  set maxInclude(value: boolean) {
    this.maxIncludeControl.setValue(value);
  }

  OnChangeWrapper(onChange: (memberOld: string) => void): (memberNew : string) => void {
    return ((memberNew:string): void => {
      this.formControl.setValue(memberNew);
      this.memberValueControl.setValue(memberNew);
      onChange(memberNew);
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

  writeValue(member: number): void {
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(member));
  }

  constructor() {}

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0),
    ).subscribe(fn => fn(this.spinner));
  }

  ngOnDestroy(): void {
    if (this.delegatedMethodsSubscription) {
      this.delegatedMethodsSubscription.unsubscribe();
    }
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.memberValueControl.setValue(this.formControl.value);
  }
}

export const memberValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const minInclude: boolean = group.get('minInclude').value;
  const min: string = group.get('minMember').value;
  const memberField = group.get('member');
  const member = memberField.value;
  const maxInclude: boolean = group.get('maxInclude').value;
  const max: string = group.get('maxMember').value;
  const originalControl: FormControl = group.get('original').value;

  const curMaxMember = !member.length ? '99' : member;
  const curMinMember = !member.length ? '0' : member;
  const minIsSmallerMember = minInclude ? (min <= curMinMember) : (min < curMinMember);
  const MemberIsSmallerMax = maxInclude ? (curMaxMember <= max) : (curMaxMember < max);

  const checkMinMembers: boolean = curMinMember <= member;
  const checkMaxMembers: boolean = member <= curMaxMember;

  const error: ValidationErrors = {invalidMember: {value: member}};

  const valid = (
    (minIsSmallerMember || MemberIsSmallerMax) &&
    (checkMinMembers && checkMaxMembers)
  );

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
