import {Pipe, PipeTransform} from '@angular/core';
import {Store} from '@ngrx/store';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {of} from 'rxjs';
import {getCollectiveById} from './value.selectors';
import {Collective} from '../../model/value';

@Pipe({
  name: 'title',
})
export class CollectivePipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(collectiveId: number): string {

    let collectiveName = '';

    of(collectiveId).pipe(
      filter(id => typeof id === 'number'),
      switchMap(id => this.store.select(getCollectiveById(id))),
      take(1),
      filter((collective: Collective): boolean => !!collective && !!Object.keys(collective).length),
      map((collective: Collective) => `${collective.title}`)
    ).subscribe(value => {
        collectiveName = value;
    });

    return collectiveName;
  }
}
