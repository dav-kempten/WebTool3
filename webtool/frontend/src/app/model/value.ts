export interface State {
  id: number;
  state: string;
  description: string;
  disabled?: boolean;
}

export enum States {
  WORKING = 1,
  READY,
  REJECTED,
  ACCEPTED,
  PUBLISHED,
  FINISHED,
  CANCELED,
  POSTPONED,
  SOON_BOOKABLE
}

export interface Category {
  id: number;
  code: string;
  name: string;
  tour: boolean;
  talk: boolean;
  instruction: boolean;
  collective: boolean;
  winter: boolean;
  summer: boolean;
  indoor: boolean;
}

export interface Approximate {
  id: number;
  name: string;
  description: string;
  startTime: string;
}

export interface Equipment {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface Skill {
  id: number;
  level: number;
  categoryId: number;
  code: string;
  description: string;
}

export interface Fitness {
  id: number;
  level: number;
  categoryId: number;
  code: string;
  description: string;
}

export interface Topic {
  id: number;
  code: string;
  title: string;
  name: string;
  description: string;
  preconditions: string;
  qualificationIds: number[];
  equipmentIds: number[];
  miscEquipment: string;
}

export interface Collective {
  id: number;
  code: string;
  title: string;
  name: string;
  description: string;
}

export interface TourCalculation {
  halfDay: string; // Decimal
  wholeDay: string; // Decimal
  admissionMinimum: string; // Decimal
}

export interface Hours {
  days: string;
  hours: string;
}

export interface HourModes {
  default: Hours[];
  special: Hours[];
}

export interface OpeningHours {
    office: HourModes;
    desk: HourModes;
}

export interface Values {
  states: State[];
  categories: Category[];
  approximates: Approximate[];
  equipments: Equipment[];
  skills: Skill[];
  fitness: Fitness[];
  topics: Topic[];
  collectives: Collective[];
  travelCostFactor: string; // Decimal
  accommodationCostMaximum: string; // Decimal
  accommodationCostDefault: string; // Decimal
  tourCalculationValues: TourCalculation;
  instructionCalculationValues: null;
  openingHours: OpeningHours;
}
