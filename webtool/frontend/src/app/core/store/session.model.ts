export interface Session {
  id: number;
  reference: string;
  guideId: number;
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
