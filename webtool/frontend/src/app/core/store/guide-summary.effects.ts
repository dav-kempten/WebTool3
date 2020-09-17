import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {GuideService} from '../service/guide.service';
import {GuideSummaryActionTypes, GuideSummariesNotModified, LoadGuideSummaries} from './guide-summary.actions';
import {GuideSummary} from '../../model/guide';

@Injectable({
  providedIn: 'root'
})
export class GuideSummaryEffects {

  constructor(private actions$: Actions, private guideService: GuideService) {}

  @Effect()
  loadGuideSummaries$: Observable<Action> = this.actions$.pipe(
    ofType(GuideSummaryActionTypes.RequestGuideSummaries),
    switchMap(() => {
      return this.guideService.getGuideSummaries().pipe(
        map((guideSummaries: GuideSummary[]) => {
          if (guideSummaries) {
            return new LoadGuideSummaries({guideSummaries});
          } else {
            return new GuideSummariesNotModified();
          }
        })
      );
    })
  );
}
