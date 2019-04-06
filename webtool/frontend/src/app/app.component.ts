import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from './app.state';

@Component({
  selector: 'avk-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  title = 'WebTool - DAV Allgäu-Kempten';

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {}
}
