import {NameListActions, NameListActionTypes} from './name.actions';
import {Name, NameList} from '../../model/name';

interface Index {[key: number]: number; }

export interface NameListState {
  isLoading: boolean;
  timestamp: number;
  names: NameList;
  index: Index;
}

export const initialState: NameListState = {
  isLoading: false,
  timestamp: 0,
  names: [],
  index: {}
};

export function reducer(state: NameListState = initialState, action: NameListActions): NameListState {
  switch (action.type) {
    case NameListActionTypes.NameListRequested:
      return {
        ... state,
        isLoading: true
      };
    case NameListActionTypes.NameListLoaded:
      const nameList: NameList = action.payload;
      const nameIndex: Index = {};
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime(),
        names: nameList,
        index: nameList.reduce((map: Index, name: Name, idx: number) => {
          map[name.id] = idx;
          return map;
        }, nameIndex)
      };
    case NameListActionTypes.NameListNotModified:
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime(),
      };
    default:
      return state;
  }
}
