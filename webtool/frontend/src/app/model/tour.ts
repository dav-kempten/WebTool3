export interface Tour {
  season: Season;
  deadline: string;
  preliminary: string | null;
  info: string;
  tour: string;
  guideId: number;
  preconditions: string;
  ladiesOnly: boolean;
  miscEquipment: string;
  admission: string;
  advances: string;
  advancesInfo: string;
  extraCharges: string;
  minQuantity: number;
  maxQuantity: number;
  curQuantity?: number;
  miscCategory: string;
  portal: string;
  calcBudget: string;
  realCosts: string;
  budgetInfo: string;
  message: string;
  comment: string;
  stateId: number;
  updated: string;
  deprecated: boolean;
}

enum Season {
  winter = "winter",
  summer = "summer"
}
