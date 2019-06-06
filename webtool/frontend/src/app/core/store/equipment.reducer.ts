import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import {Equipment} from '../../model/value';
import { EquipmentActions, EquipmentActionTypes } from './equipment.actions';

export interface State extends EntityState<Equipment> {}

export const adapter: EntityAdapter<Equipment> = createEntityAdapter<Equipment>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: EquipmentActions): State {
  switch (action.type) {

    case EquipmentActionTypes.AddEquipments: {
      return adapter.addMany(action.payload.equipments, state);
    }

    case EquipmentActionTypes.ClearEquipments: {
      return adapter.removeAll(state);
    }

    default: {
      return state;
    }
  }
}

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
