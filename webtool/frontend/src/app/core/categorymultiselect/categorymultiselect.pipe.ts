import {Pipe, PipeTransform} from '@angular/core';
import {of} from 'rxjs';
import {filter, switchMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Category} from '../../model/value';
import {getCategoriesByIds, getCategoryById} from '../store/value.selectors';

@Pipe({
  name: 'categorymultiselect',
})
export class CategorymultiselectPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(categoryIds: number[] | Category[] | null): number[] | Category[] {
    let categories = new Array<Category>(0);

    of(categoryIds).pipe(
      filter((ids): ids is number[] => !!ids.length),
      switchMap(ids => this.store.select(getCategoriesByIds(ids))),
    ).subscribe(value => categories = value);

    return categories;
  }
}
