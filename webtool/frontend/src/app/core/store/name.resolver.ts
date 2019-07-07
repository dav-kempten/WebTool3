import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {AppState} from '../../app.state';
import {NamesRequested} from './name.actions';
import {getNamesState} from './name.selectors';
import {Name} from '../../model/name';

@Injectable({
  providedIn: 'root'
})
export class NameListResolver implements Resolve<Name[]> {

  constructor(private store: Store<AppState>) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Name[]> {
    return this.store.pipe(
      select(getNamesState),
      map(namesState => {
        if (!namesState.isLoading) {
          const lastUpdate = namesState.timestamp;
          const ageOfData = (new Date().getTime()) - lastUpdate;
          if (ageOfData > (15 * 60 * 1000)) {
            this.store.dispatch(new NamesRequested());
          }
        }
        return [];
      }),
      first()
    );
  }
}

