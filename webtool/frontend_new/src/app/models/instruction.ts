import { Event } from './event';

/** Flat UI shape: sub-events referenced by id, money fields numeric. */
export interface Instruction {
  id: number;
  reference: string;
  guideId: number | null;
  teamIds: number[];
  topicId: number;
  instructionId: number; // main event id
  meetingIds: number[]; // meeting event ids
  kvLink: string;
  ladiesOnly: boolean;
  isSpecial: boolean;
  categoryId: number | null;
  qualificationIds: number[];
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
  deprecated: boolean;
  stateId: number;
  comment: string;
  message: string;
}

/** Wire shape from `GET /api/frontend/instructions/{id}/`: nested events, decimal strings. */
export interface RawInstruction
  extends Omit<
    Instruction,
    'instructionId' | 'meetingIds' | 'admission' | 'advances' | 'extraCharges'
  > {
  instruction: Event;
  meetings: Event[];
  admission: string;
  advances: string;
  extraCharges: string;
}

export interface InstructionSummary {
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
  indoor: boolean;
  minQuantity: number;
  maxQuantity: number;
  curQuantity: number;
  stateId: number;
  url: string;
}