import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {NameService} from '../service/name.service';
import {NameListActionTypes, NameListLoaded, NameListNotModified} from './name.actions';

@Injectable({
  providedIn: 'root'
})
export class NameListEffects {

  constructor(private actions$: Actions, private nameService: NameService) {}

  @Effect()
  loadNameList$: Observable<Action> = this.actions$.pipe(
    ofType(NameListActionTypes.NameListRequested),
    switchMap(() => {
      return this.nameService.getNameList().pipe(
        map(nameList => {
          if (nameList && nameList.length) {
            return new NameListLoaded(nameList);
          } else {
            return new NameListNotModified();
          }
        })
      );
    })
  );
}
