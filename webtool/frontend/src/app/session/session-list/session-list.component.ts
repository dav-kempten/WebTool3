import { Component, OnInit } from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';

@Component({
  selector: 'avk-session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.css']
})
export class SessionListComponent implements OnInit {

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
  }

}
