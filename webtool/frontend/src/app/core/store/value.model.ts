import {OpeningHours} from '../../model/value';

export interface TourCalculation {
  halfDay: number;
  wholeDay: number;
  admissionMinimum: number;
}

export interface Values {
  travelCostFactor: number;
  accommodationCostMaximum: number;
  accommodationCostDefault: number;
  tourCalculationValues: TourCalculation;
  instructionCalculationValues: null;
  openingHours: OpeningHours;
}
