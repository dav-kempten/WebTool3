import {
  Approximate, Category, Collective,
  Equipment, Fitness as RawFitness, OpeningHours, Skill, State, Topic
} from '../../model/value';

export interface States { [key: number]: State; }
export interface Categories { [key: number]: Category; }
export interface Approximates { [key: number]: Approximate; }
export interface Equipments { [key: number]: Equipment; }
export interface Skills { [key: number]: Skill; }
export interface Fitness { [key: number]: RawFitness; }
export interface Topics { [key: number]: Topic; }
export interface Collectives { [key: number]: Collective; }

export interface TourCalculation {
  halfDay: number;
  wholeDay: number;
  admissionMinimum: number;
}

export interface Values {
  states: States;
  categories: Categories;
  approximates: Approximates;
  equipments: Equipments;
  skills: Skills;
  fitness: Fitness;
  topics: Topics;
  collectives: Collectives;
  travelCostFactor: number;
  accommodationCostMaximum: number;
  accommodationCostDefault: number;
  tourCalculationValues: TourCalculation;
  instructionCalculationValues: null;
  openingHours: OpeningHours;
}
