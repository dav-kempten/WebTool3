import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {TourService} from '../service/tour.service';
import {
  AddTour,
  CloneTour,
  TourActionTypes,
  TourNotModified,
  RequestTour
} from './tour.actions';
import {Event} from '../../model/event';
import {AppState} from '../../app.state';
import {AddEvent} from './event.actions';
import {Tour} from './tour.model';
import {Tour as RawTour} from '../../model/tour';

function convertDecimal(rawValue: string): number {
  return Number(rawValue.replace('.', ''));
}

@Injectable({
  providedIn: 'root'
})
export class TourEffects {

  constructor(private actions$: Actions, private tourService: TourService, private store: Store<AppState>) {}

  @Effect()
  loadTour$: Observable<Action> = this.actions$.pipe(
    ofType<RequestTour>(TourActionTypes.RequestTour),
    map((action: RequestTour) => action.payload),
    switchMap(payload => {
      return this.tourService.getTour(payload.id).pipe(
        map(tour => {
          if (tour.id !== 0) {
            return new AddTour({tour: this.transformTour(tour)});
          } else {
            return new TourNotModified();
          }
        })
      );
    })
  );

  @Effect()
  cloneTour$: Observable<Action> = this.actions$.pipe(
    ofType<CloneTour>(TourActionTypes.CloneTour),
    map((action: CloneTour) => action.payload),
    switchMap(payload => {
      return this.tourService.cloneTour(payload.id).pipe(
        map(tour => {
          if (tour.id !== 0) {
            return new AddTour({tour: this.transformTour(tour)});
          } else {
            return new TourNotModified();
          }
        })
      );
    })
  );

  transformTour(tour: RawTour): Tour {
    const tourId = tour.id;
    const deadlineId = tour.deadline.id;
    const preliminaryId = tour.preliminary.id;

    this.store.dispatch(new AddEvent({event: tour.tour}));
    this.store.dispatch(new AddEvent({event: tour.deadline}));
    this.store.dispatch(new AddEvent({event: tour.preliminary}));

    delete tour.tour;
    delete tour.deadline;
    delete tour.preliminary;

    return {
      ... tour,
      tourId,
      deadlineId,
      preliminaryId,
      admission: convertDecimal(tour.admission),
      advances: convertDecimal(tour.advances),
      extraCharges: convertDecimal(tour.extraCharges)
    };
  }
}
