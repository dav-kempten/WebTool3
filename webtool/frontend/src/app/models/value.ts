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
  SOON_BOOKABLE,
}

export enum StatesGroup {
  Active = 1,
  /** Closed events (durchgeführt/ausgefallen) — also guards deletion. */
  Finished,
  All,
  /** Exactly the "Fertig" state, i.e. handed in for review. */
  Ready,
}

export function getStatesOfGroup(group: StatesGroup): States[] {
  switch (group) {
    case StatesGroup.Active:
      return [
        States.WORKING,
        States.READY,
        States.REJECTED,
        States.ACCEPTED,
        States.PUBLISHED,
        States.POSTPONED,
        States.SOON_BOOKABLE,
      ];
    case StatesGroup.Finished:
      return [States.FINISHED, States.CANCELED];
    case StatesGroup.Ready:
      return [States.READY];
    case StatesGroup.All:
      return [
        States.WORKING,
        States.READY,
        States.REJECTED,
        States.ACCEPTED,
        States.PUBLISHED,
        States.FINISHED,
        States.CANCELED,
        States.POSTPONED,
        States.SOON_BOOKABLE,
      ];
  }
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

/**
 * Topics that stand for a special course — currently "Spezialkurs" (summer) and
 * "Winter Spezialkurs". Such courses carry their own title, description and
 * requirements in the main event instead of inheriting them from the topic, so
 * the Sonderkurs flag is pre-set on creation and locked afterwards.
 *
 * Derived from the title rather than the category code so a future special
 * topic is covered without changes here — the same approach the backend uses
 * for youth tours (`'Jugend' in category.name`, tours.py).
 */
export function isSpecialTopic(topic: Topic | undefined): boolean {
  return topic?.title.includes('Spezialkurs') ?? false;
}

export interface Collective {
  id: number;
  code: string;
  title: string;
  name: string;
  managers: number[];
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
