import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Qualification} from '../../model/value';
import {QualificationActions, QualificationActionTypes} from './qualification.actions';

export interface State extends EntityState<Qualification> {}

export const adapter: EntityAdapter<Qualification> = createEntityAdapter<Qualification>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: QualificationActions): State {
  switch (action.type) {

    case QualificationActionTypes.AddQualifications: {
      return adapter.addMany(action.payload.qualifications, state);
    }

    case QualificationActionTypes.ClearQualifications: {
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
