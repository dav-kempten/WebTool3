import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {NameService} from '../service/name.service';
import {AddNames, NameActionTypes, NamesNotModified} from './name.actions';

@Injectable({
  providedIn: 'root'
})
export class NameEffects {

  constructor(private actions$: Actions, private nameService: NameService) {}

  @Effect()
  loadNames$: Observable<Action> = this.actions$.pipe(
    ofType(NameActionTypes.NamesRequested),
    switchMap(() => {
      return this.nameService.getNames().pipe(
        map(names => {
          if (names && names.length) {
            return new AddNames({names});
          } else {
            return new NamesNotModified();
          }
        })
      );
    })
  );
}
