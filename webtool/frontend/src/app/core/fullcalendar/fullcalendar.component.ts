import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {RequestTourcalendars} from '../store/tour-calendar.actions';

@Component({
  selector: 'avk-fullcalendar',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FullcalendarComponent),
      multi: true
    }
  ],
  templateUrl: './fullcalendar.component.html',
  styleUrls: ['./fullcalendar.component.css']
})
export class FullcalendarComponent implements OnInit {

  @Input() event = 'Veranstaltung';

  events: any[];
  options: any;

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new RequestTourcalendars());
  }

  ngOnInit() {
    this.options = {
      defaultDate: '2021-01-01',
      header: {
        left: 'prev, next',
        center: 'title',
        right: 'month'
      }
    };
  }

}
