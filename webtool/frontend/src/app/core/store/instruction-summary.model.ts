export interface InstructionSummary {
  id: number;
  reference: string;
  title: string;
  startDate: string;
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
