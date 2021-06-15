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
import {TourSummary as RawTourSummary} from '../../model/tour';
import {TourSummary} from './tour-summary.model';
import {NamePipe} from './name.pipe';

@Injectable({
  providedIn: 'root',
})
export class TourSummaryEffects {

  constructor(private actions$: Actions, private tourService: TourService, private namePipe: NamePipe) {}

  @Effect()
  loadTourSummaries$: Observable<Action> = this.actions$.pipe(
    ofType(TourSummaryActionTypes.RequestTourSummaries),
    switchMap(() => {
      return this.tourService.getTourSummaries().pipe(
        map((tourSummaries) => {
          if (tourSummaries.length > 0) {
            return new LoadTourSummaries({tourSummaries: this.transformSummaries(tourSummaries)});
          } else {
            return new TourSummariesNotModified();
          }
        })
      );
    })
  );

  transformSummaries(tourSummaries: RawTourSummary[]): TourSummary[] {
    let storeTourSummaries: any = [];

    storeTourSummaries = tourSummaries;
    storeTourSummaries.forEach(summary => {
      summary.guide = this.namePipe.transform(summary.guideId);
    });

    return storeTourSummaries;
  }
}
