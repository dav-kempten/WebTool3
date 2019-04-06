import {Component, OnInit} from '@angular/core';
import {Time} from '@angular/common';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';

@Component({
  selector: 'avk-time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.css']
})
export class TimeComponent implements OnInit {

  id = 'time';
  label = 'Uhrzeit';
  value: Time;

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
  }

}
