import { Event } from './event';

/** Flat UI shape: the single sub-event referenced by id. */
export interface Session {
  id: number;
  reference: string;
  guideId: number | null;
  teamIds: number[];
  speaker: string;
  collectiveId: number;
  sessionId: number;
  ladiesOnly: boolean;
  categoryIds: number[];
  miscCategory: string;
  equipmentIds: number[];
  miscEquipment: string;
  message: string;
  comment: string;
  deprecated: boolean;
  stateId: number;
}

/** Wire shape from `GET /api/frontend/sessions/{id}/`: nested event. */
export interface RawSession extends Omit<Session, 'sessionId'> {
  session: Event;
}

export interface SessionSummary {
  id: number;
  reference: string;
  title: string;
  guideId: number;
  speaker: string;
  collectiveId: number;
  ladiesOnly: boolean;
  stateId: number;
  url: string;
}