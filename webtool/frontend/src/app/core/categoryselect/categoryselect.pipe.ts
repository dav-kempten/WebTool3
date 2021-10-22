import {Pipe, PipeTransform} from '@angular/core';
import {of} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Category} from '../../model/value';
import {getCategoryById} from '../store/value.selectors';

@Pipe({
  name: 'categoryselect',
})
export class CategoryselectPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(categoryId: number | Category | null): number | Category {
    let category: Category = null;

    of(categoryId).pipe(
      filter((id): id is number => typeof id === 'number'),
      switchMap(id => this.store.select(getCategoryById(id))),
      take(1),
    ).subscribe(value => category = value);

    return category ? category : categoryId;
  }
}
