import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {SessionService} from '../service/session.service';
import {
  SessionSummaryActionTypes,
  LoadSessionSummaries,
  SessionSummariesNotModified
} from './session-summary.actions';
import {SessionSummary} from '../../model/session';

@Injectable({
  providedIn: 'root'
})
export class SessionSummaryEffects {

  constructor(private actions$: Actions, private sessionService: SessionService) {}

  @Effect()
  loadSessionSummaries$: Observable<Action> = this.actions$.pipe(
    ofType(SessionSummaryActionTypes.RequestSessionSummaries),
    switchMap(() => {
      return this.sessionService.getSessionSummaries().pipe(
        map((sessionSummaries: SessionSummary[]) => {
          if (sessionSummaries.length > 0) {
            return new LoadSessionSummaries({sessionSummaries});
          } else {
            return new SessionSummariesNotModified();
          }
        })
      );
    })
  );
}
