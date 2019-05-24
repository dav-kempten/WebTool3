import {
  Approximates, Categories, Collectives, Equipments, Fitness, Skills, States, Topics, TourCalculation, Values
} from './value.model';
import {
  Approximate, Category, Collective, Equipment, Fitness as RawFitness,
  Skill, State, Topic, TourCalculation as RawTourCalculation, Values as RawValues
} from '../../model/value';
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
    states: [],
    categories: [],
    approximates: [],
    equipments: [],
    skills: [],
    fitness: [],
    topics: [],
    collectives: [],
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
      states: rawValues.states.reduce(
        (states: States, state: State) => { states[state.id] = state; return states; }, {}
      ),
      categories: rawValues.categories.reduce(
        (categories: Categories, category: Category) => { categories[category.id] = category; return categories; }, {}
      ),
      approximates: rawValues.approximates.reduce(
        (approximates: Approximates, approximate: Approximate) => { approximates[approximate.id] = approximate; return approximates; }, {}
      ),
      equipments: rawValues.equipments.reduce(
        (equipments: Equipments, equipment: Equipment) => { equipments[equipment.id] = equipment; return equipments; }, {}
      ),
      skills: rawValues.skills.reduce(
        (skills: Skills, skill: Skill) => { skills[skill.id] = skill; return skills; }, {}
      ),
      fitness: rawValues.fitness.reduce(
        (fitnessMap: Fitness, fitness: RawFitness) => { fitnessMap[fitness.id] = fitness; return fitnessMap; }, {}
      ),
      topics: rawValues.topics.reduce(
        (topics: Topics, topic: Topic) => { topics[topic.id] = topic; return topics; }, {}
      ),
      collectives: rawValues.collectives.reduce(
        (collectives: Collectives, collective: Collective) => { collectives[collective.id] = collective; return collectives; }, {}
      ),
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
