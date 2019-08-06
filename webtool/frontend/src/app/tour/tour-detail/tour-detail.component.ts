import {BehaviorSubject, Observable} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
import {tourGroupFactory} from '../../core/factories';
import {Tour} from '../../core/store/tour.model';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {CalendarRequested} from '../../core/store/calendar.actions';

@Component({
  selector: 'avk-tour-detail',
  templateUrl: './tour-detail.component.html',
  styleUrls: ['./tour-detail.component.css']
})
export class TourDetailComponent implements OnInit {

  private tourSubject = new BehaviorSubject<FormGroup>(undefined);
  tourGroup$: Observable<FormGroup> = this.tourSubject.asObservable();

  tourId$: Observable<number>;

  tourFrame: Tour = {
    id: 0,
    reference: 'BLA-666',
    categoryId: 0,
    miscCategory: '',
    ladiesOnly: false,
    youthOnTour: false,
    lowEmissionAdventure: true,
    bikeTrain: true,
    deadline: '2019-09-21',
    preliminary: '2019-09-22',
    info: '',
    tourstart: '2019-09-23',
    tourend: '2019-09-24',
    portal: '',
    season: '',
    guideId: 384,
    teamIds: [],
    preconditionId: 0,
    miscEquipment: '',
    admission: 0,
    advances: 0,
    advancesInfo: '',
    extraCharges: 0,
    minQuantity: 0,
    maxQuantity: 0,
    curQuantity : 0,
    calcBudget: 0,
    realCosts: 0,
    budgetInfo: '',
    message: '',
    comment: '',
    stateId: 0,
    updated: '',
    deprecated: false,
    shortTitle: '',
    longTitle: '',
    equipmentIds: [],
    equipmentService: true,
    preconditions: ''
  };

  tourForm: FormGroup = tourGroupFactory(this.tourFrame);

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit(): void {
    this.tourId$ = this.store.pipe(select(selectRouterDetailId));

    this.tourSubject.next(this.tourForm);
  }
}
