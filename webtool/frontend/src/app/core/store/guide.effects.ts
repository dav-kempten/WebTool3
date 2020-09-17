import {Observable, Subject} from 'rxjs';
import {map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {GuideService} from '../service/guide.service';
import {AppState} from '../../app.state';
import {AddGuide, GuideActionTypes, GuideNotModified, RequestGuide} from './guide.actions';

function convertDecimal(rawValue: string): number {
  return Number(rawValue.replace('.', ''));
}

@Injectable({
  providedIn: 'root'
})
export class GuideEffects {
  events$: Observable<Event[]>;

  constructor(private actions$: Actions, private guideService: GuideService, private store: Store<AppState>) {
  }

  @Effect()
  loadInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<RequestGuide>(GuideActionTypes.RequestGuide),
    map((action: RequestGuide) => action.payload),
    switchMap(payload => {
      return this.guideService.getGuide(payload.id).pipe(
        map(guideInstance => {
          if (guideInstance.id !== 0) {
            return new AddGuide({guide: guideInstance});
          } else {
            return new GuideNotModified();
          }
        })
      );
    })
  );
}
