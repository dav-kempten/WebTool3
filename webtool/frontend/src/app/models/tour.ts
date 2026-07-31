export interface Tour {
  id: number;
  reference: string;
  guideId: number;
  teamIds: number[];
  categoryId: number;
  categoryIds: number[];
  tourId: number;
  deadlineId: number;
  preliminaryId: number | null;
  info: string;
  youthOnTour: boolean;
  relaxed: boolean;
  mountainBus: boolean;
  kvLink: string;
  ladiesOnly: boolean;
  qualificationIds: number[];
  preconditions: string;
  equipmentIds: number[];
  miscEquipment: string;
  equipmentService: boolean;
  skillId: number;
  fitnessId: number;
  admission: number;
  advances: number;
  advancesInfo: string;
  extraCharges: number;
  extraChargesInfo: string;
  minQuantity: number;
  maxQuantity: number;
  curQuantity?: number;
  deprecated: boolean;
  stateId: number;
  comment: string;
  message: string;
}

/**
 * Wire shape of a single tour as returned by `GET /api/frontend/tours/{id}/`
 * and accepted by POST/PUT: the three sub-events are nested objects and the
 * money fields are decimal strings (vs. the numeric `Tour` used in the UI).
 */
export interface RawTour
  extends Omit<Tour, 'tourId' | 'deadlineId' | 'preliminaryId' | 'admission' | 'advances' | 'extraCharges'> {
  tour: import('./event').Event;
  deadline: import('./event').Event;
  preliminary: import('./event').Event | null;
  admission: string;
  advances: string;
  extraCharges: string;
}

export interface TourSummary {
  id: number;
  reference: string;
  title: string;
  startDate: string;
  endDate: string | null;
  guideId: number;
  guide: string;
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
