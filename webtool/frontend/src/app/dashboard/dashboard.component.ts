import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../app.state';
import {AuthService, User} from '../core/service/auth.service';
import {FormControl, FormGroup} from '@angular/forms';
import {CreateTour} from '../core/store/tour.actions';
import {tap} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Component({
  selector: 'avk-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  authState$: Observable<User>;
  preliminarySelect = false;
  display = false;
  userId = 0;

  categoryIds = new FormControl('');
  startDate = new FormControl('');
  deadline = new FormControl('');
  preliminary = new FormControl(null);

  createTour: FormGroup = new FormGroup({
    categoryIds: this.categoryIds,
    startDate: this.startDate,
    deadline: this.deadline,
    preliminary: this.preliminary
  });

  constructor(private store: Store<AppState>, private authService: AuthService) {}

  ngOnInit() {
    this.authState$ = this.authService.user$;

    this.authState$.pipe(
      tap(value => {
        this.userId = value.id;
        console.log(this.userId);
      }),
    ).subscribe();
  }

  proposeTour() {
    this.display = !this.display;
  }

  selectPreliminary() {
    this.preliminarySelect = !this.preliminarySelect;
    if (this.preliminarySelect === false) {
      this.preliminary.setValue(null);
    }
  }

  create(category, startdate, enddate, preliminary, guideId) {
    this.store.dispatch(new CreateTour({
      categoryId: category, startDate: startdate, deadline: enddate, preliminary, guideId
    }));
  }

}
