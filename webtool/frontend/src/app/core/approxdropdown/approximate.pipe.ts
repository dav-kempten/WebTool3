import {Pipe, PipeTransform} from '@angular/core';
import {of} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Approximate} from '../../model/value';
import {getApproximateById} from '../store/value.selectors';

@Pipe({
  name: 'approximate',
})
export class ApproximatePipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(approximateId: number | Approximate | null): number | Approximate {
    let approximate: Approximate = null;

    of(approximateId).pipe(
      filter((id): id is number => typeof id === 'number'),
      switchMap(id => this.store.select(getApproximateById(id))),
      take(1),
      filter((value: Approximate): boolean => !!value && !!Object.keys(value).length),
    ).subscribe(value => approximate = value);

    return approximate ? approximate : approximateId;
  }
}
