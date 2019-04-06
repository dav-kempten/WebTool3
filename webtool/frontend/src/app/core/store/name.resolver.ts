import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {NameList} from '../../model/name';
import {AppState} from '../../app.state';
import {getNameListState} from './name.selectors';
import {NameListRequested} from './name.actions';

@Injectable({
  providedIn: 'root'
})
export class NameListResolver implements Resolve<NameList> {

  constructor(private store: Store<AppState>) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<NameList> {
    return this.store.pipe(
      select(getNameListState),
      map((nameListState): NameList => {
        if (!nameListState.isLoading) {
          const lastUpdate = nameListState.timestamp;
          const ageOfData = (new Date().getTime()) - lastUpdate;
          if (ageOfData > (15 * 60 * 1000)) {
            this.store.dispatch(new NameListRequested());
          }
        }
        return [];
      }),
      first()
    );
  }
}

