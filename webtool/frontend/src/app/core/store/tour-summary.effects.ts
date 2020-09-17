import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {TourService} from '../service/tour.service';
import {
  TourSummaryActionTypes,
  LoadTourSummaries,
  TourSummariesNotModified
} from './tour-summary.actions';
import {TourSummary} from '../../model/tour';

@Injectable({
  providedIn: 'root'
})
export class TourSummaryEffects {

  constructor(private actions$: Actions, private tourService: TourService) {}

  @Effect()
  loadTourSummaries$: Observable<Action> = this.actions$.pipe(
    ofType(TourSummaryActionTypes.RequestTourSummaries),
    switchMap(() => {
      return this.tourService.getTourSummaries().pipe(
        map((tourSummaries: TourSummary[]) => {
          if (tourSummaries) {
            return new LoadTourSummaries({tourSummaries});
          } else {
            return new TourSummariesNotModified();
          }
        })
      );
    })
  );
}
