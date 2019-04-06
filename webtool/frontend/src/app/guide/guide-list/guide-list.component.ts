import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';

@Component({
  selector: 'avk-guide-list',
  templateUrl: './guide-list.component.html',
  styleUrls: ['./guide-list.component.css']
})
export class GuideListComponent implements OnInit {

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
  }

}
