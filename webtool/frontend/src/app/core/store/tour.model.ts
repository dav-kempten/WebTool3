export interface Tour {
  id: number;
  reference: string;
  guideId: number;
  teamIds: number[];
  categoryIds: number[];
  tourId: number;
  deadlineId: number;
  preliminaryId: number | null;
  youthOnTour: boolean;
  lowEmissionAdventure: boolean;
  ladiesOnly: boolean;
  preconditions: string;
  equipmentIds: number[];
  miscEquipment: string;
  equipmentService: boolean;
  admission: number;
  advances: number;
  advancesInfo: string;
  extraCharges: number;
  extraChargesInfo: string;
  minQuantity: number;
  maxQuantity: number;
  curQuantity?: number;
  stateId: number;
}
