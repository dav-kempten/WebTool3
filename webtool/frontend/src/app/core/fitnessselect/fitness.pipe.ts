import {Pipe, PipeTransform} from '@angular/core';
import {of} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Fitness} from '../../model/value';
import {getFitnessByCategoryAndLevel} from '../store/value.selectors';

@Pipe({
  name: 'fitnessselect',
})
export class FitnessPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(fitnessId: any | Fitness | null): number | Fitness {
    let fitness: Fitness = null;

    of(fitnessId).pipe(
      filter(id => typeof id.categoryId === 'number' && typeof id.levelId === 'number'),
      switchMap(id => this.store.select(getFitnessByCategoryAndLevel(id.categoryId, id.levelId))),
      take(1),
    ).subscribe(value => fitness = value);

    return fitness ? fitness : fitnessId;
  }
}
