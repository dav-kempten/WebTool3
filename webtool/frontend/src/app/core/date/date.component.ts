import {ReplaySubject, Subscription} from 'rxjs';
import {delay} from 'rxjs/operators';
import {
  OnInit, OnDestroy,
  AfterContentInit, AfterViewInit,
  Input, Output,
  Component, ContentChild, ViewChild, forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR,
  FormControl, FormControlName, FormGroup,
  ValidationErrors, ValidatorFn
} from '@angular/forms';
import {Calendar, LocaleSettings} from 'primeng/calendar';

const german: LocaleSettings = {
  firstDayOfWeek: 1,
  dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  monthNamesShort: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  today: 'Heute',
  clear: 'Löschen',
  dateFormat: 'dd.mm.yy'
};

@Component({
  selector: 'avk-date',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateComponent),
      multi: true
    }
  ],
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.css']
})
export class DateComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(Calendar) calendar: Calendar;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  @Input() id = 'date';
  @Input() label = 'Datum';

  @Input()
  set required(value: boolean) {
    this.isRequired = value;
    this.dateIsRequiredControl.setValue(value);
  }
  @Output() isRequired: boolean;

  minDate = new Date();
  maxDate = new Date(`${((this.minDate).getFullYear() + 1)}-12-31`);
  yearRange = `${this.minDate.getFullYear()}:${this.maxDate.getFullYear()}`;
  defaultDate: Date = this.minDate;

  de = german;

  originalControl = new FormControl(null);
  labelControl = new FormControl('');
  minValueControl = new FormControl('');
  minIncludeControl = new FormControl(false);
  optMinValueControl = new FormControl('');
  optMinIncludeControl = new FormControl(false);
  dateValueControl = new FormControl('');
  dateIsRequiredControl = new FormControl(false);
  optMaxIncludeControl = new FormControl(false);
  maxIncludeControl = new FormControl(false);
  optMaxValueControl = new FormControl('');
  maxValueControl = new FormControl('');

  group = new FormGroup(
    {
      original: this.originalControl,
      label: this.labelControl,
      min: this.minValueControl,
      minInclude: this.minIncludeControl,
      optMin: this.optMinValueControl,
      optMinInclude: this.optMinIncludeControl,
      date: this.dateValueControl,
      dateIsRequired: this.dateIsRequiredControl,
      optMaxInclude: this.optMaxIncludeControl,
      maxInclude: this.maxIncludeControl,
      optMax: this.optMaxValueControl,
      max: this.maxValueControl
    },
    [dateValidator]
  );

  @Input()
  set min(value: string) {
    this.minValueControl.setValue(value);
    if (!!value) {
      this.defaultDate = new Date(value);
    }
  }

  @Input()
  set minInclude(value: boolean) {
    this.minIncludeControl.setValue(value);
  }

  @Input()
  set optMin(value: string) {
    this.optMinValueControl.setValue(value);
    if (!!value) {
      this.defaultDate = new Date(value);
    }
  }

  @Input()
  set optMinInclude(value: boolean) {
    this.optMinIncludeControl.setValue(value);
  }

  @Input()
  set maxInclude(value: boolean) {
    this.maxIncludeControl.setValue(value);
  }

  @Input()
  set max(value: string) {
    this.maxValueControl.setValue(value);
    if (!!value) {
      this.defaultDate = new Date(value);
    }
  }

  @Input()
  set optMaxInclude(value: boolean) {
    this.optMaxIncludeControl.setValue(value);
  }

  @Input()
  set optMax(value: string) {
    this.optMaxValueControl.setValue(value);
    if (!!value) {
      this.defaultDate = new Date(value);
    }
  }

  OnChangeWrapper(onChange: (isoDate: string) => void): (stdDate: string) => void {
    return ((stdDate: string): void => {
      const isoDate = dateTransformer(stdDate);
      this.formControl.setValue(isoDate);
      this.dateValueControl.setValue(isoDate);
      onChange(isoDate);
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

  writeValue(isoDate: string): void {
    const stdDate = isoDate.split('-').reverse().join('.');
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stdDate));
  }

  constructor() {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0),
    ).subscribe(fn => fn(this.calendar));
  }

  ngOnDestroy(): void {
    if (this.delegatedMethodsSubscription) {
      this.delegatedMethodsSubscription.unsubscribe();
    }
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.dateValueControl.setValue(this.formControl.value);
    this.labelControl.setValue(this.label);
  }

}

export const dateTransformer = (date: string | null): string => {
  return date ? date.split('.').reverse().join('-') : '';
};

export const dateValidator: ValidatorFn = (group: FormGroup): ValidationErrors | null => {
  const minInclude: boolean = group.get('minInclude').value;
  const min: string = group.get('min').value;
  const optMinInclude: boolean = group.get('optMinInclude').value;
  const optMin: string = group.get('optMin').value;
  const dateField = group.get('date');
  const date = dateField.value;
  const dateIsRequired = group.get('dateIsRequired').value;
  const optMaxInclude: boolean = group.get('optMaxInclude').value;
  const optMax: string = group.get('optMax').value;
  const maxInclude: boolean = group.get('maxInclude').value;
  const max: string = group.get('max').value;
  const originalControl: FormControl = group.get('original').value;

  const curMaxDate = (!date.length && dateIsRequired) ? '9999-12-31' : date;
  const curMinDate = (!date.length && dateIsRequired) ? '0000-01-01' : date;
  const minIsSmallerDate = minInclude ? (min <= curMinDate) : (min < curMinDate);
  const optMinIsSmallerDate = optMinInclude ? (optMin <= curMinDate) : (optMin < curMinDate);
  const DateIsSmallerOptMax = optMaxInclude ? (curMaxDate <= optMax) : (curMaxDate < optMax);
  const DateIsSmallerMax = maxInclude ? (curMaxDate <= max) : (curMaxDate < max);

  const curMin = optMin ? optMin : min;
  const curMax = optMax ? optMax : max;
  const curMinCompare = optMin ? optMinIsSmallerDate : minIsSmallerDate;
  const curMaxCompare = optMax ? DateIsSmallerOptMax : DateIsSmallerMax;

  const error: ValidationErrors = {invalidDate: {value: date}};

  const valid = (
    curMin.length && curMax.length && curMinCompare && curMaxCompare ||
    !curMin.length && curMax.length && curMaxCompare ||
    curMin.length && !curMax.length && curMinCompare ||
    !curMin.length && !curMax.length && date.length ||
    !date.length && !dateIsRequired
  );

  if (originalControl) {
    setTimeout(() => {
      originalControl.setErrors(valid ? null : error);
    });
  }

  return null;
};
