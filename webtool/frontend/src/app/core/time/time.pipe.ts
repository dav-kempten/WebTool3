import {Pipe, PipeTransform} from '@angular/core';
import {of} from 'rxjs';
import {filter, map, switchMap, tap} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Approximate} from '../../model/value';
import {getApproximateById} from '../store/value.selectors';

@Pipe({
  name: 'time',
})
export class TimePipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(time: string, approximateId?: number | null): string {
    if (!approximateId) {
      return time;
    } else {
      let approximate = '';

      of(approximateId).pipe(
        filter(id => typeof id === 'number'),
        switchMap(id => this.store.select(getApproximateById(id))),
        filter((value: Approximate): boolean => !!value && !!Object.keys(value).length),
        map((value: Approximate) => value.name)
      ).subscribe(value => {
          approximate = value;
      });

      return approximate;
    }
  }
}
