import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {GuideService} from '../service/guide.service';
import {AddGuides, GuideActionTypes, GuidesNotModified} from './guide.actions';

@Injectable({
  providedIn: 'root'
})
export class GuideEffects {

  constructor(private actions$: Actions, private guideService: GuideService) {}

  @Effect()
  loadGuides$: Observable<Action> = this.actions$.pipe(
    ofType(GuideActionTypes.GuidesRequested),
    switchMap(() => {
      return this.guideService.getGuides().pipe(
        map(guides => {
          if (guides && guides.length) {
            return new AddGuides({guides});
          } else {
            return new GuidesNotModified();
          }
        })
      );
    })
  );
}
