import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State, selectAll} from './instruction-calendar.reducer';

export const getInstructionCalendarState = createFeatureSelector<State>('instructionCalendar');
export const getInstructionCalendar = createSelector(getInstructionCalendarState, selectAll);
