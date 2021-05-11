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
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {Calendar, LocaleSettings} from 'primeng/primeng';
import {
  ControlValueAccessor,
  FormControl,
  FormControlName,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {ReplaySubject, Subscription} from 'rxjs';
import {delay} from 'rxjs/operators';

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
  selector: 'avk-time',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeComponent),
      multi: true
    }
  ],
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.css']
})
export class TimeComponent implements OnInit, AfterViewInit, OnDestroy, AfterContentInit {
  @Input() label = 'Zeitpunkt';

  @ViewChild(Calendar) calendar: Calendar;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;

  de = german;

  disabledState = false;

  @Input()
  set disable(value) {
    this.disabledState = !!value;
  }

  OnChangeWrapper(onChange: (isoDate: string) => void): (stdDate: string) => void {
    return ((stdDate: string): void => {
      onChange(stdDate);
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

  writeValue(isoDate): void {
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(isoDate));
  }

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void { }

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
  }
}
