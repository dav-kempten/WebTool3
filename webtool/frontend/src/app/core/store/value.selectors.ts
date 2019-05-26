import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ValueState} from './value.reducer';
import {TourCalculation, Values} from './value.model';
import {OpeningHours} from '../../model/value';

export const getValueState = createFeatureSelector<ValueState>('values');

export const getValues = createSelector(getValueState, (state: ValueState): Values => state.values);
export const getValuesIsLoading = createSelector(getValueState, (state: ValueState): boolean => state.isLoading);
export const getValuesTimestamp = createSelector(getValueState, (state: ValueState): number => state.timestamp);

export const getTravelCostFactor = createSelector(
  getValues, (values: Values): number => values.travelCostFactor
);

export const getAccommodationCostMaximum = createSelector(
  getValues, (values: Values): number => values.accommodationCostMaximum
);

export const getAccommodationCostDefault = createSelector(
  getValues, (values: Values): number => values.accommodationCostDefault
);

export const getTourCalculationValues = createSelector(
  getValues, (values: Values): TourCalculation => values.tourCalculationValues
);

export const getOpeningHours = createSelector(
  getValues, (values: Values): OpeningHours => values.openingHours
);
