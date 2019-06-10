import {Anniversary, Vacation} from "../../model/calendar";


export interface Anniversaries { [key:number]: Anniversary; }
export interface Vacations { [key:number]: Vacation; }

export interface Calendars {
  id: number;
  year: number;
  anniversaries: Anniversaries;
  vacations: Vacations;
}
