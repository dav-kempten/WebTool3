export interface Calendar {
  id: number;
  year: number;
  anniversaries: Anniversary[];
  vacations: Vacation[];
}

export interface Anniversary {
  id: number;
  name: string;
  date: string;
  publicHoliday: boolean;
}

export interface Vacation {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}
