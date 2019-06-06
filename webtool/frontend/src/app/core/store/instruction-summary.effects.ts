import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {InstructionService} from '../service/instruction.service';
import {
  InstructionSummaryActionTypes,
  LoadInstructionSummaries,
  InstructionSummariesNotModified
} from './instruction-summary.actions';
import {InstructionSummary} from '../../model/instruction';

@Injectable({
  providedIn: 'root'
})
export class InstructionSummaryEffects {

  constructor(private actions$: Actions, private instructionService: InstructionService) {}

  @Effect()
  loadInstructionSummaries$: Observable<Action> = this.actions$.pipe(
    ofType(InstructionSummaryActionTypes.RequestInstructionSummaries),
    switchMap(() => {
      return this.instructionService.getInstructionSummaries().pipe(
        map((instructionSummaries: InstructionSummary[]) => {
          if (instructionSummaries) {
            return new LoadInstructionSummaries({instructionSummaries});
          } else {
            return new InstructionSummariesNotModified();
          }
        })
      );
    })
  );
}
