import {Observable} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormControl, FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';

@Component({
  selector: 'avk-tour-detail',
  templateUrl: './tour-detail.component.html',
  styleUrls: ['./tour-detail.component.css']
})
export class TourDetailComponent implements OnInit {

  tourId$: Observable<number>;

  deadline = new FormControl('');
  preliminary = new FormControl('');
  tourStart = new FormControl('');
  tourEnd =  new FormControl('');

  tourForm = new FormGroup({
    deadline: this.deadline,
    preliminary: this.preliminary,
    tourStart: this.tourStart,
    tourEnd: this.tourEnd
  });

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.tourId$ = this.store.pipe(select(selectRouterDetailId));
    this.tourForm.setValue({
      deadline: '2019-09-23',
      preliminary: '2019-09-25',
      tourStart: '2019-09-27',
      tourEnd: '2019-09-29',
    });
  }

}
