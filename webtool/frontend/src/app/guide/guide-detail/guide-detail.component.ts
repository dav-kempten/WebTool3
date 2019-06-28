import {Observable} from 'rxjs';
import {Component, ElementRef, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {FormControl, FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
import {getNamesIsLoading} from '../../core/store/name.selectors';
import {NamesRequested} from '../../core/store/name.actions';

@Component({
  selector: 'avk-guide-detail',
  templateUrl: './guide-detail.component.html',
  styleUrls: ['./guide-detail.component.css'],
})
export class GuideDetailComponent implements OnInit {

  guideId$: Observable<number>;
  isLoading$: Observable<boolean>;

  guide = new FormControl(undefined);
  team = new FormControl([]);
  guideForm = new FormGroup({
    guideId: this.guide,
    teamIds: this.team
  });

  constructor(private store: Store<AppState>, private el: ElementRef) {
    this.store.dispatch(new NamesRequested());
    this.guideForm.setValue({guideId: 105, teamIds: [105, 326, 105]});
  }

  ngOnInit(): void {
    this.guideId$ = this.store.select(selectRouterDetailId);
    this.isLoading$ = this.store.select(getNamesIsLoading);
  }
}
