export interface Tour {
  season: string;
  deadline: string;
  preliminary: string | null;
  info: string;
  tour: string;
  guideId: number;
  preconditions: string;
  ladiesOnly: boolean;
  miscEquipment: string;
  admission: number;
  advances: number;
  advancesInfo: string;
  extraCharges: number;
  minQuantity: number;
  maxQuantity: number;
  curQuantity?: number;
  miscCategory: string;
  portal: string;
  calcBudget: number;
  realCosts: number;
  budgetInfo: string;
  message: string;
  comment: string;
  stateId: number;
  updated: string;
  deprecated: boolean;
}
