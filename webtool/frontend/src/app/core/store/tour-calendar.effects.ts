import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {TourCalendarService} from '../service/tour-calendar.service';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import {
  TourcalendarsActionTypes,
  TourcalendarsNotModified,
  LoadTourcalendars
} from './tour-calendar.actions';
import {map, switchMap} from 'rxjs/operators';
import {Fullcalendar} from '../../model/fullcalendars';


@Injectable({
  providedIn: 'root'
})
export class TourCalendarEffects {

  constructor(private actions$: Actions, private calendarService: TourCalendarService) {}

  @Effect()
  loadTourCalendar$: Observable<Action> = this.actions$.pipe(
    ofType(TourcalendarsActionTypes.RequestTourcalendars),
    switchMap(() => {
      return this.calendarService.getTourCalendar().pipe(
        map((tours: Fullcalendar[]) => {
          if (tours.length > 0) {
            return new LoadTourcalendars({tours});
          } else {
            return new TourcalendarsNotModified();
          }
        })
      );
    })
  );
}
