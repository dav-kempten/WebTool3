export interface Instruction {
  id: number; // InstructionId
  reference: string;
  guideId: number; // NameId
  teamIds: number[]; // NameId
  topicId: number; // TopicId
  instructionId: number; // EventId
  meetingIds: number[]; // EventId
  lowEmissionAdventure: boolean;
  ladiesOnly: boolean;
  isSpecial: boolean;
  categoryId: number | null;
  qualificationIds: number[]; // QualificationId
  preconditions: string;
  equipmentIds: number[]; // EquipmentId
  miscEquipment: string;
  equipmentService: boolean;
  admission: number; // Decimal
  advances: number; // Decimal
  advancesInfo: string;
  extraCharges: number; // Decimal
  extraChargesInfo: string;
  minQuantity: number;
  maxQuantity: number;
  curQuantity?: number;
  deprecated: boolean;
  stateId: number;
  comment: string;
  message: string;
}
