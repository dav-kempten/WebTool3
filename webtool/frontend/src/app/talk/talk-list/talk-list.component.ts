import { Component, OnInit } from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';

@Component({
  selector: 'avk-talk-list',
  templateUrl: './talk-list.component.html',
  styleUrls: ['./talk-list.component.css']
})
export class TalkListComponent implements OnInit {

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
  }

}
