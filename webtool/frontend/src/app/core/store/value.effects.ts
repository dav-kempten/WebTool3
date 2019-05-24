import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {ValueService} from '../service/value.service';
import {ValuesActionTypes, ValuesLoaded, ValuesNotModified} from './value.actions';
import {Values as RawValues} from '../../model/value';

@Injectable({
  providedIn: 'root'
})
export class ValueEffects {

  constructor(private actions$: Actions, private valueService: ValueService) {}

  @Effect()
  loadValues$: Observable<Action> = this.actions$.pipe(
    ofType(ValuesActionTypes.ValuesRequested),
    switchMap(() => {
      return this.valueService.getValues().pipe(
        map((values: RawValues) => {
          if (values) {
            return new ValuesLoaded(values);
          } else {
            return new ValuesNotModified();
          }
        })
      );
    })
  );
}
