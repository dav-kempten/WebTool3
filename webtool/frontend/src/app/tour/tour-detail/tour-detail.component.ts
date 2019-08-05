import {BehaviorSubject, Observable} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
import {tourGroupFactory} from "../../core/factories";
import {Tour} from "../../core/store/tour.model";

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
    reference: "",
    categoryId: 0,
    miscCategory: "",
    ladiesOnly: false,
    youthOnTour: false,
    deadline: '2019-09-21',
    preliminary: '2019-09-22',
    info: "",
    tourstart: '2019-09-23',
    tourend: '2019-09-24',
    portal: "",
    season: "",
    guideId: 0,
    teamIds: 0,
    preconditions: "",
    miscEquipment: "",
    admission: 0,
    advances: 0,
    advancesInfo: "",
    extraCharges: 0,
    minQuantity: 0,
    maxQuantity: 0,
    curQuantity : 0,
    calcBudget: 0,
    realCosts: 0,
    budgetInfo: "",
    message: "",
    comment: "",
    stateId: 0,
    updated: "",
    deprecated: false,
  };

  tourForm: FormGroup = tourGroupFactory(this.tourFrame);

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.tourId$ = this.store.pipe(select(selectRouterDetailId));

    this.tourSubject.next(this.tourForm);
  }
}
