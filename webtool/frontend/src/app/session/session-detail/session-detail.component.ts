import {Observable} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';

@Component({
  selector: 'avk-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.css']
})
export class SessionDetailComponent implements OnInit {

  sessionId$: Observable<number>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.sessionId$ = this.store.pipe(select(selectRouterDetailId));
  }

}
