import {Event} from './event';

export interface InstructionSummary {
  id: number;
  reference: string;
  title: string;
  startDate: string;
  guideId: number;
  ladiesOnly: boolean;
  winter: boolean;
  summer: boolean;
  indoor: boolean;
  minQuantity: number;
  maxQuantity: number;
  curQuantity: number;
  stateId: number;
  url: string;
}

export interface Instruction {
  id: number;
  reference: string;
  guideId: number | null;
  teamIds: number[];
  topicId: number;
  instruction: Event;
  meetings: Event[];
  lowEmissionAdventure: boolean;
  ladiesOnly: boolean;
  isSpecial: boolean;
  categoryId: number | null;
  qualificationIds: number[];
  preconditions: string;
  equipmentIds: number[];
  miscEquipment: string;
  equipmentService: boolean;
  admission: string; // Decimal
  advances: string; // Decimal
  advancesInfo: string;
  extraCharges: string; // Decimal
  extraChargesInfo: string;
  minQuantity: number;
  maxQuantity: number;
  curQuantity?: number;
  deprecated: boolean;
  stateId: number;
}
