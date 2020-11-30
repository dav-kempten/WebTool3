import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../app.state';
import {AuthService, User} from '../core/service/auth.service';
import {FormControl, FormGroup} from '@angular/forms';
import {CreateTour} from '../core/store/tour.actions';
import {tap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {CreateInstruction} from '../core/store/instruction.actions';

@Component({
  selector: 'avk-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  authState$: Observable<User>;
  preliminarySelect = false;
  displayTour = false;
  displayInstruction = false;
  userIsStaff = false;
  userId = 0;

  categoryIds = new FormControl('');
  startDateTour = new FormControl('');
  deadlineTour = new FormControl('');
  preliminary = new FormControl(null);

  topicId = new FormControl('');
  startDateInstruction = new FormControl('');

  createTour: FormGroup = new FormGroup({
    categoryIds: this.categoryIds,
    startDate: this.startDateTour,
    deadline: this.deadlineTour,
    preliminary: this.preliminary
  });

  createInstruction: FormGroup = new FormGroup({
    topicId: this.topicId,
    startDate: this.startDateInstruction
  });

  constructor(private store: Store<AppState>, private authService: AuthService) {}

  ngOnInit() {
    this.authState$ = this.authService.user$;

    this.authState$.pipe(
      tap(value => {
        this.userIsStaff = (value.role === 'Geschäftsstelle' || value.role === 'Administrator');
        this.userId = value.id;
      }),
    ).subscribe();
  }

  proposeTour() {
    this.displayTour = !this.displayTour;
  }

  proposeInstruction() {
    this.displayInstruction = !this.displayInstruction;
  }

  selectPreliminary() {
    this.preliminarySelect = !this.preliminarySelect;
    if (this.preliminarySelect === false) {
      this.preliminary.setValue(null);
    }
  }

  creatingTour(category, startdate, enddate, preliminary, guideId) {
    if (this.userIsStaff) { guideId = null; }
    this.store.dispatch(new CreateTour({
      categoryId: category, startDate: startdate, deadline: enddate, preliminary, guideId
    }));
  }

  creatingInstruction(topic, startdate, guideId) {
    if (this.userIsStaff) { guideId = null; }
    this.store.dispatch(new CreateInstruction({
      topicId: topic, startDate: startdate, guideId
    }));
  }

}
