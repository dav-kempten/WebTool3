import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ValueState} from './value.reducer';
import {
  Approximates, Categories, Collectives, Equipments, Fitness, Skills, States, Topics, TourCalculation, Values
} from './value.model';
import {
  Approximate, Category, Collective, Equipment, Fitness as RawFitness, OpeningHours, Skill, State, Topic
} from '../../model/value';

export const getValueState = createFeatureSelector<ValueState>('values');

export const getValues = createSelector(getValueState, (state: ValueState): Values => state.values);
export const getValuesIsLoading = createSelector(getValueState, (state: ValueState): boolean => state.isLoading);
export const getValuesTimestamp = createSelector(getValueState, (state: ValueState): number => state.timestamp);

export const getStates = createSelector(getValues, (values: Values): States => values.states);
export const getStateById = createSelector(getStates, (states: States, props): State =>
  !!props.stateId ? states[props.stateId] : null
);

export const getCategories = createSelector(getValues, (values: Values): Categories => values.categories);
export const getCategoryById = createSelector(
  getCategories, (categories: Categories, props): Category =>
    !!props.categoryId ? categories[props.categoryId] : null
);

export const getApproximates = createSelector(
  getValues, (values: Values): Approximates => values.approximates
);
export const getApproximateById = createSelector(
  getApproximates, (approximates: Approximates, props): Approximate =>
    !!props.approximateId ? approximates[props.approximateId] : null
);

export const getEquipments = createSelector(getValues, (values: Values): Equipments => values.equipments);
export const getEquipmentById = createSelector(
  getEquipments, (equipments: Equipments, props): Equipment =>
    !!props.equipmentId ? equipments[props.equipmentId] : null
);

export const getSkills = createSelector(getValues, (values: Values): Skills => values.skills);
export const getSkillById = createSelector(
  getSkills, (skills: Skills, props): Skill =>
    !!props.skillId ? skills[props.skillId] : null
);

export const getFitness = createSelector(getValues, (values: Values): Fitness => values.fitness);
export const getFitnessById = createSelector(
  getFitness, (fitness: Fitness, props): RawFitness =>
    !!props.fitnessId ? fitness[props.fitnessId] : null
);

export const getTopics = createSelector(getValues, (values: Values): Topics => values.topics);
export const getTopicById = createSelector(getTopics, (topics: Topics, props): Topic =>
  !!props.topicId ? topics[props.topicId] : null
);

export const getCollectives = createSelector(getValues, (values: Values): Collectives => values.collectives);
export const getCollectiveById = createSelector(
  getCollectives, (collectives: Collectives, props): Collective =>
    !!props.collectiveId ? collectives[props.collectiveId] : null
);

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
