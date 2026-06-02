import {Observable, Subject} from 'rxjs';
import {map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {TourService} from '../service/tour.service';
import {
  AddTour,
  CloneTour,
  TourActionTypes,
  TourNotModified,
  RequestTour,
  DeleteTour,
  DeactivateTour,
  UpsertTour, CreateTour, UpdateTour
} from './tour.actions';
import {AppState} from '../../app.state';
import {AddEvent} from './event.actions';
import {Tour} from './tour.model';
import {Tour as RawTour} from '../../model/tour';
import {Event} from '../../model/event';
import {RequestTourSummaries} from './tour-summary.actions';
import {Router} from '@angular/router';
import {EventPipe} from './event.pipe';

function convertDecimal(rawValue: string): number {
  return Number(rawValue);
}

@Injectable({
  providedIn: 'root'
})
export class TourEffects {

  constructor(private actions$: Actions, private tourService: TourService, private store: Store<AppState>, private router: Router,
              private pipe: EventPipe) {}

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
      return this.tourService.cloneTour(this.tranformTourForCloning(payload.tour, payload.startDate, payload.endDate)).pipe(
        map(tour => {
          if (tour.id !== 0) {
            this.router.navigate(['tours', tour.id]);
            return new RequestTourSummaries();
          } else {
            return new TourNotModified();
          }
        })
      );
    })
  );

  @Effect()
  deleteTour$: Observable<Action> = this.actions$.pipe(
    ofType<DeleteTour>(TourActionTypes.DeleteTour),
    map((action: DeleteTour) => action.payload),
    switchMap((payload) => {
      return this.tourService.deleteTour(payload.id).pipe(
        map(tour => {
          if (tour === null) {
            return new RequestTourSummaries();
          } else {
            return new TourNotModified();
          }
        })
      );
    })
  );

  @Effect()
  deactivateTour$: Observable<Action> = this.actions$.pipe(
    ofType<DeactivateTour>(TourActionTypes.DeactivateTour),
    map((action: DeactivateTour) => action.payload),
    switchMap(payload => {
      return this.tourService.deactivateTour(payload.id).pipe(
        map(tour => {
          if (tour.id !== 0) {
            return new RequestTourSummaries();
          } else {
            return new TourNotModified();
          }
        })
      );
    })
  );

  @Effect()
  createTour$: Observable<Action> = this.actions$.pipe(
    ofType<CreateTour>(TourActionTypes.CreateTour),
    map((action: CreateTour) => action.payload),
    switchMap(payload => {
      return this.tourService.createTour(
        payload.categoryId, payload.startDate, payload.deadline, payload.preliminary, payload.guideId
      ).pipe(
        map(tour => {
          if (tour.id !== 0) {
            this.router.navigate(['tours', tour.id]);
            return new RequestTourSummaries();
          } else {
            alert('Tourerstellung fehlgeschlagen. Bitte Eingaben nocheinmal überprüfen.');
            return new TourNotModified();
          }
        })
      );
    })
  );

  @Effect()
  safeTour$: Observable<Action> = this.actions$.pipe(
    ofType<UpsertTour>(TourActionTypes.UpsertTour),
    map((action: UpsertTour) => action.payload),
    switchMap(payload  => {
      return this.tourService.upsertTour(this.tranformTourForSaving(payload.tour)).pipe(
        map(tour => {
          if (tour.id !== 0) {
            alert('Tour erfolgreich gespeichert.');
            const tourInterface = this.transformTour(tour);
            this.store.dispatch(new RequestTourSummaries());
            return new UpdateTour({tour: {
              id: tourInterface.id,
              changes: {...tourInterface}
            }});
          } else {
            alert('Tour speichern gescheitert, nocheinmal versuchen oder Seite neuladen.');
            return new TourNotModified();
          }
        })
      );
    })
  );

  transformTour(tour: RawTour): Tour {
    const tourId = tour.id;
    const deadlineId = tour.deadline.id;
    let preliminaryId = null;

    this.store.dispatch(new AddEvent({event: tour.tour}));
    this.store.dispatch(new AddEvent({event: tour.deadline}));

    if (tour.preliminary !== null) {
      preliminaryId = tour.preliminary.id;
      this.store.dispatch(new AddEvent({event: tour.preliminary}));
    }

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

  tranformTourForSaving(tourInterface: Tour): RawTour {

    const events = this.pipe.transform([tourInterface.tourId, tourInterface.deadlineId, tourInterface.preliminaryId]);

    const tour = events[0];
    const deadline = events[1];
    let preliminary: Event;
    events.length > 2 ? preliminary = events[2] : preliminary = null;

    /* erase distance field of deadline & preliminary  */
    deadline.distance = 0;
    if (preliminary) { preliminary.distance = 0; }

    if (tourInterface.admission == null) { tourInterface.admission = 0 }
    if (tourInterface.advances == null) { tourInterface.advances = 0 }
    if (tourInterface.extraCharges == null) { tourInterface.extraCharges = 0 }

    return {
      ... tourInterface,
      tour,
      deadline,
      preliminary,
      admission: String(tourInterface.admission),
      advances: String(tourInterface.advances),
      extraCharges: String(tourInterface.extraCharges)
    };
  }

  tranformTourForCloning(tourInterface: Tour, startDate: string, endDate: string | null): RawTour {
    const events = this.pipe.transform([tourInterface.tourId, tourInterface.deadlineId, tourInterface.preliminaryId]);

    const tour = events[0];
    tour.startDate = startDate;
    !!endDate ? tour.endDate = endDate : tour.endDate = null;

    const deadline = events[1];
    let preliminary: Event;
    events.length > 2 ? preliminary = events[2] : preliminary = null;

    return {
      ... tourInterface,
      tour,
      deadline,
      preliminary,
      admission: String(tourInterface.admission),
      advances: String(tourInterface.advances),
      extraCharges: String(tourInterface.extraCharges)
    };
  }
}
