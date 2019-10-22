import {Event} from './event';

export interface SessionSummary {
  id: number;
  reference: string;
  title: string;
  guideId: number;
  speaker: string;
  ladiesOnly: boolean;
  stateId: number;
  url: string;
}

export interface Session {
  id: number;
  reference: string;
  guideId: number | null;
  teamIds: number[];
  speaker: string;
  collectiveId: number;
  session: Event;
  ladiesOnly: boolean;
  categoryIds: number[];
  miscCategory: string;
  equipmentIds: number[];
  miscEquipment: string;
  stateId: number;
}
