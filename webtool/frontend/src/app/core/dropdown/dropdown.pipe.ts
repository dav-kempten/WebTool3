import {Pipe, PipeTransform} from '@angular/core';
import {of} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {State} from '../../model/value';
import {getStateById} from '../store/value.selectors';

@Pipe({
  name: 'dropdown',
})
export class DropdownPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(stateId: number | State | null): number | State {
    let state: State = null;

    of(stateId).pipe(
      filter((id): id is number => typeof id === 'number'),
      switchMap(id => this.store.select(getStateById(id))),
      take(1),
    ).subscribe(value => state = value);

    return state ? state : stateId;
  }
}
