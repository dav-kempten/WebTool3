import { Component, OnInit } from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';

@Component({
  selector: 'avk-tour-list',
  templateUrl: './tour-list.component.html',
  styleUrls: ['./tour-list.component.css']
})
export class TourListComponent implements OnInit {

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
  }

}
