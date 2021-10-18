import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {ValueService} from '../service/value.service';
import {ValuesActionTypes, ValuesLoaded, ValuesNotModified} from './value.actions';
import {Collective, Values as RawValues} from '../../model/value';
import {AppState} from '../../app.state';
import {AddStates} from './state.actions';
import {AddCategories} from './category.actions';
import {AddApproximates} from './approximate.actions';
import {AddEquipments} from './equipment.actions';
import {AddSkills} from './skill.actions';
import {AddFitness} from './fitness.actions';
import {AddTopics} from './topic.actions';
import {AddCollectives} from './collective.actions';

@Injectable({
  providedIn: 'root'
})
export class ValueEffects {

  constructor(private actions$: Actions, private valueService: ValueService, private store: Store<AppState>) {}

  @Effect()
  loadValues$: Observable<Action> = this.actions$.pipe(
    ofType(ValuesActionTypes.ValuesRequested),
    switchMap(() => {
      return this.valueService.getValues().pipe(
        map((values: RawValues) => {
          if (values && values.states.length !== 0) {
            this.store.dispatch(new AddStates({states: values.states}));
            this.store.dispatch(new AddCategories({categories: values.categories}));
            this.store.dispatch(new AddApproximates({approximates: values.approximates}));
            this.store.dispatch(new AddEquipments({equipments: values.equipments}));
            this.store.dispatch(new AddSkills({skills: values.skills}));
            this.store.dispatch(new AddFitness({fitness: values.fitness}));
            this.store.dispatch(new AddTopics({topics: values.topics}));
            this.store.dispatch(new AddCollectives({collectives: mergeCollectives(values.collectives)}));
            return new ValuesLoaded(values);
          } else {
            return new ValuesNotModified();
          }
        })
      );
    })
  );
}

function mergeCollectives(collectives: Collective[]): Collective[] {
  const mergeCollectiveArray = new Array(0);
  let managerIds = new Array(0);
  /* Store all IDs of collectives in an array */
  const collectiveIds = Array.from(new Set(collectives.map(el => el.id)));
  /* Get managers of collectives as Arrays & combine them with the corresponding collectives */
  for (const collectiveId of collectiveIds) {
    managerIds = collectives.filter(value => value.id === collectiveId).map(value => value.managers.shift());
    mergeCollectiveArray.push({
      ...collectives.find(value => value.id === collectiveId),
      managers: managerIds.shift() !== undefined ? managerIds : []
    });
  }
  return mergeCollectiveArray;
}
