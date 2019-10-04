import {BehaviorSubject, Observable} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormControl, FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
import {Tour} from '../../core/store/tour.model';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {CalendarRequested} from '../../core/store/calendar.actions';
import {Category} from '../../model/value';
import {Event} from '../../model/event';

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
    categoryIds: [10],
    ladiesOnly: false,
    youthOnTour: false,
    lowEmissionAdventure: true,
    tourId: 221,
    deadlineId: 222,
    preliminaryId: 223,
    guideId: 384,
    teamIds: [],
    miscEquipment: '',
    admission: 0,
    advances: 0,
    advancesInfo: '',
    extraCharges: 0,
    extraChargesInfo: '',
    minQuantity: 0,
    maxQuantity: 0,
    curQuantity : 0,
    stateId: 0,
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
    categoryId: new FormControl(tour.categoryIds),
    ladiesOnly: new FormControl(tour.ladiesOnly),
    lowEmissionAdventure: new FormControl(tour.lowEmissionAdventure),
    youthOnTour: new FormControl(tour.youthOnTour),
    deadline: new FormControl(tour.deadlineId),
    preliminary: new FormControl(tour.preliminaryId),
    guideId: new FormControl(tour.guideId),
    teamIds: new FormControl(tour.teamIds),
    preconditionId: new FormControl(tour.preconditions),
    miscEquipment: new FormControl(tour.miscEquipment),
    admission: new FormControl((tour.admission / 100).toFixed(2)),
    advances: new FormControl((tour.advances / 100).toFixed(2)),
    advancesInfo: new FormControl(tour.advancesInfo),
    extraCharges: new FormControl((tour.extraCharges / 100).toFixed(2)),
    minQuantity: new FormControl(tour.minQuantity),
    maxQuantity: new FormControl(tour.maxQuantity),
    curQuantity: new FormControl(tour.curQuantity),
    stateId: new FormControl(tour.stateId),
    equipmentIds: new FormControl(tour.equipmentIds),
    equipmentService: new FormControl(tour.equipmentService),
    preconditions: new FormControl(tour.preconditions)
  });
}

function categoryGroupFactory(category: Category): FormGroup {
  return new FormGroup({
    id: new FormControl(category.id),
    code: new FormControl(category.code),
    name: new FormControl(category.name),
    tour: new FormControl(category.tour),
    talk: new FormControl(category.talk),
    instruction: new FormControl(category.instruction),
    collective: new FormControl(category.collective),
    winter: new FormControl(category.winter),
    summer: new FormControl(category.summer),
    indoor: new FormControl(category.indoor),
  });
}

function eventGroupFactory(event: Event): FormGroup {
  return new FormGroup({
    id: new FormControl(event.id),
    title: new FormControl(event.title),
    name: new FormControl(event.name),
    description: new FormControl(event.description),
    startDate: new FormControl(event.startDate),
    startTime: new FormControl(event.startTime),
    approximateId: new FormControl(event.approximateId),
    endDate: new FormControl(event.endDate),
    rendezvous: new FormControl(event.rendezvous),
    location: new FormControl(event.location),
    reservationService: new FormControl(event.reservationService),
    source: new FormControl(event.source),
    link: new FormControl(event.link),
    map: new FormControl(event.map),
    distal: new FormControl(event.distal),
    distance: new FormControl({value: event.distance, disabled: !event.distal}),
    publicTransport: new FormControl(event.publicTransport),
    shuttleService: new FormControl(event.shuttleService)
  });
}
