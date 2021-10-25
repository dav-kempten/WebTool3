import {Pipe, PipeTransform} from '@angular/core';
import {of} from 'rxjs';
import {filter, switchMap} from 'rxjs/operators';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Equipment} from '../../model/value';
import {getEquipmentByIds} from '../store/value.selectors';

@Pipe({
  name: 'multiselect',
})
export class MultiselectPipe implements PipeTransform {

  constructor(private store: Store<AppState>) {}

  transform(equipmentIds: number[] | Equipment[] | null): number[] | Equipment[] {
    let equipments = new Array<Equipment>(0);

    of(equipmentIds).pipe(
      filter((ids): ids is number[] => !!ids.length),
      switchMap(ids => this.store.select(getEquipmentByIds(ids))),
    ).subscribe(value => equipments = value);

    return equipments;
  }
}
