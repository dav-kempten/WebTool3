import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {AppState} from '../../app.state';
import {GuidesRequested} from './guide.actions';
import {getGuidesState} from './guide.selectors';
import {Guide} from '../../model/guide';

@Injectable({
  providedIn: 'root'
})
export class GuideListResolver implements Resolve<Guide[]> {

  constructor(private store: Store<AppState>) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Guide[]> {
    return this.store.pipe(
      select(getGuidesState),
      map(guidesState => {
        if (!guidesState.isLoading) {
          const lastUpdate = guidesState.timestamp;
          const ageOfData = (new Date().getTime()) - lastUpdate;
          if (ageOfData > (15 * 60 * 1000)) {
            this.store.dispatch(new GuidesRequested());
          }
        }
        return [];
      }),
      first()
    );
  }
}

