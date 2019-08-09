import {BehaviorSubject, Observable} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormControl, FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
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



export function tourGroupFactory(tour: Tour): FormGroup {
  return new FormGroup({
    id: new FormControl(tour.id),
    reference: new FormControl(tour.reference),
    categoryId: new FormControl(tour.categoryId),
    miscCategory: new FormControl(tour.miscCategory),
    ladiesOnly: new FormControl(tour.ladiesOnly),
    lowEmissionAdventure: new FormControl(tour.lowEmissionAdventure),
    bikeTrain: new FormControl(tour.bikeTrain),
    youthOnTour: new FormControl(tour.youthOnTour),
    deadline: new FormControl(tour.deadline),
    preliminary: new FormControl(tour.preliminary),
    info: new FormControl(tour.info),
    tourstart: new FormControl(tour.tourstart),
    tourend: new FormControl(tour.tourend),
    portal: new FormControl(tour.portal),
    season: new FormControl(tour.season),
    guideId: new FormControl(tour.guideId),
    teamIds: new FormControl(tour.teamIds),
    preconditionId: new FormControl(tour.preconditionId),
    miscEquipment: new FormControl(tour.miscEquipment),
    admission: new FormControl((tour.admission / 100).toFixed(2)),
    advances: new FormControl((tour.advances / 100).toFixed(2)),
    advancesInfo: new FormControl(tour.advancesInfo),
    extraCharges: new FormControl((tour.extraCharges / 100).toFixed(2)),
    minQuantity: new FormControl(tour.minQuantity),
    maxQuantity: new FormControl(tour.maxQuantity),
    curQuantity: new FormControl(tour.curQuantity),
    calcBudget: new FormControl(tour.calcBudget),
    realCosts: new FormControl(tour.realCosts),
    budgetInfo: new FormControl(tour.budgetInfo),
    message: new FormControl(tour.message),
    comment: new FormControl(tour.comment),
    stateId: new FormControl(tour.stateId),
    updated: new FormControl(tour.updated),
    deprecated: new FormControl(tour.deprecated),
    shortTitle: new FormControl(tour.shortTitle),
    longTitle: new FormControl(tour.longTitle),
    equipmentIds: new FormControl(tour.equipmentIds),
    equipmentService: new FormControl(tour.equipmentService),
    preconditions: new FormControl(tour.preconditions)
  });
}
