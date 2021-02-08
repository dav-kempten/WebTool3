import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from './app.state';
import {ClearTours} from './core/store/tour.actions';
import {ClearInstructions} from './core/store/instruction.actions';
import {ClearSessions} from './core/store/session.actions';

@Component({
  selector: 'avk-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  title = 'WebTool - DAV Allgäu-Kempten';

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store.dispatch(new ClearTours());
    this.store.dispatch(new ClearInstructions());
    this.store.dispatch(new ClearSessions());
  }
}
