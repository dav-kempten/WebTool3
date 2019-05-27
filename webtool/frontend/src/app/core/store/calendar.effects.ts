import { Injectable } from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {CalendarService} from "../service/calendar.service";
import {Action, Store} from "@ngrx/store";
import {AppState} from "../../app.state";
import {Observable} from "rxjs";
import {CalendarActionTypes, CalendarLoaded, CalendarNotModified} from "./calendar.actions";
import {Calendar as RawCalendar} from "../../model/calendar";
import {map, switchMap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class CalendarEffects {

  constructor(private actions$: Actions, private calendarService: CalendarService, private store: Store<AppState>) {}

  @Effect()
  loadCalendars$: Observable<Action> = this.actions$.pipe(
    ofType(CalendarActionTypes.CalendarRequested),
    switchMap(() => {
      return this.calendarService.getCalendar().pipe(
        map((calendars: RawCalendar) => {
          if (calendars.id !== 0) {
            return new CalendarLoaded(calendars);
          } else {
            return new CalendarNotModified();
          }
        })
      );
    })
  );
}
