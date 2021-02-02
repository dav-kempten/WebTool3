import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {InstructionCalendarService} from '../service/instruction_calendar.service';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import {
  InstructioncalendarsActionTypes,
  InstructioncalendarsNotModified,
  LoadInstructioncalendars
} from './instruction-calendar.actions';
import {map, switchMap} from 'rxjs/operators';
import {Fullcalendar} from '../../model/fullcalendars';


@Injectable({
  providedIn: 'root'
})
export class InstructionCalendarEffects {

  constructor(private actions$: Actions, private calendarService: InstructionCalendarService) {}

  @Effect()
  loadInstructionCalendar$: Observable<Action> = this.actions$.pipe(
    ofType(InstructioncalendarsActionTypes.RequestInstructioncalendars),
    switchMap(() => {
      return this.calendarService.getInstructionCalendar().pipe(
        map((fullcalendar: Fullcalendar[]) => {
          if (fullcalendar.length > 0) {
            return new LoadInstructioncalendars({fullcalendar});
          } else {
            return new InstructioncalendarsNotModified();
          }
        })
      );
    })
  );
}
