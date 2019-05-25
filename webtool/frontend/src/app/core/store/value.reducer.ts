import {TourCalculation, Values} from './value.model';
import {TourCalculation as RawTourCalculation, Values as RawValues} from '../../model/value';
import {ValuesActions, ValuesActionTypes} from './value.actions';

export interface ValueState {
  isLoading: boolean;
  timestamp: number;
  values: Values;
}

export const initialState: ValueState = {
  isLoading: false,
  timestamp: 0,
  values: {
    travelCostFactor: 0,
    accommodationCostMaximum: 0,
    accommodationCostDefault: 0,
    tourCalculationValues: {
      halfDay: 0,
      wholeDay: 0,
      admissionMinimum: 0
    },
    instructionCalculationValues: null,
    openingHours: {
      office: {
          default: [],
          special: []
      },
      desk: {
          default: [],
          special: []
      }
    }
  }
};

function convertDecimal(rawValue: string): number {
  return Number(rawValue.replace('.', ''));
}

function convertTourCalculationValues(rawValues: RawTourCalculation): TourCalculation {
  return {
    halfDay: convertDecimal(rawValues.halfDay),
    wholeDay: convertDecimal(rawValues.wholeDay),
    admissionMinimum: convertDecimal(rawValues.admissionMinimum)
  };
}

function transform(rawValues: RawValues | null): Values | null {
  if (rawValues) {
    return {
      travelCostFactor: convertDecimal(rawValues.travelCostFactor),
      accommodationCostMaximum: convertDecimal(rawValues.accommodationCostMaximum),
      accommodationCostDefault: convertDecimal(rawValues.accommodationCostDefault),
      tourCalculationValues: convertTourCalculationValues(rawValues.tourCalculationValues),
      instructionCalculationValues: null,
      openingHours: rawValues.openingHours
    };
  }
}

export function reducer(state: ValueState = initialState, action: ValuesActions): ValueState {
  switch (action.type) {
    case ValuesActionTypes.ValuesRequested:
      return {
        ... state,
        isLoading: true
      };
    case ValuesActionTypes.ValuesLoaded:
      return {
        ... state,
        values: transform(action.payload),
        isLoading: false,
        timestamp: new Date().getTime()
      };
    case ValuesActionTypes.ValuesNotModified:
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime(),
      };
    default:
      return state;
  }
}
