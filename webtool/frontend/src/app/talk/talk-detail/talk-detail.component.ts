import {Observable} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';

@Component({
  selector: 'avk-talk-detail',
  templateUrl: './talk-detail.component.html',
  styleUrls: ['./talk-detail.component.css']
})
export class TalkDetailComponent implements OnInit {

  talkId$: Observable<number>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.talkId$ = this.store.pipe(select(selectRouterDetailId));
  }

}
