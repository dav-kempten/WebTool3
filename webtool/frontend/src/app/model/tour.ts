import {Event} from './event';

export interface TourSummary {
  id: number;
  reference: string;
  title: string;
  startDate: string;
  guideId: number;
  ladiesOnly: boolean;
  winter: boolean;
  summer: boolean;
  youthOnTour: boolean;
  minQuantity: number;
  maxQuantity: number;
  curQuantity: number;
  stateId: number;
  url: string;
}

export interface Tour {
  id: number;
  reference: string;
  guideId: number | null;
  teamIds: number[];
  categoryId: number;
  categoryIds: number[];
  tour: Event;
  deadline: Event;
  preliminary: Event | null;
  youthOnTour: boolean;
  lowEmissionAdventure: boolean;
  ladiesOnly: boolean;
  qualificationIds: number[];
  preconditions: string;
  equipmentIds: number[];
  miscEquipment: string;
  equipmentService: boolean;
  skillId: number | null;
  fitnessId: number | null;
  admission: string;
  advances: string;
  advancesInfo: string;
  extraCharges: string;
  extraChargesInfo: string;
  minQuantity: number;
  maxQuantity: number;
  curQuantity?: number;
  stateId: number;
}
