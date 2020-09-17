import {Pipe, PipeTransform} from '@angular/core';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {of} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {getStateById} from './value.selectors';
import {State} from '../../model/value';

@Pipe({
  name: 'state',
})
export class StatePipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(stateId: number): string {

    let stateName = '';

    of(stateId).pipe(
      filter(id => typeof id === 'number'),
      switchMap(id => this.store.select(getStateById(id))),
      take(1),
      filter((state: State): boolean => !!state && !!Object.keys(state).length),
      map((state: State) => `${state.state}`)
    ).subscribe(value => {
      stateName = value;
    });

    return stateName;
  }

}
