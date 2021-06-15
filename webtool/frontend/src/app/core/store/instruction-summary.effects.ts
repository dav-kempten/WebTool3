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
import {InstructionSummary} from './instruction-summary.model';
import {InstructionSummary as RawInstructionSummary} from '../../model/instruction';
import {NamePipe} from './name.pipe';

@Injectable({
  providedIn: 'root'
})
export class InstructionSummaryEffects {

  constructor(private actions$: Actions, private instructionService: InstructionService, private namePipe: NamePipe) {}

  @Effect()
  loadInstructionSummaries$: Observable<Action> = this.actions$.pipe(
    ofType(InstructionSummaryActionTypes.RequestInstructionSummaries),
    switchMap(() => {
      return this.instructionService.getInstructionSummaries().pipe(
        map((instructionSummaries) => {
          if (instructionSummaries.length > 0) {
            return new LoadInstructionSummaries({instructionSummaries: this.transformSummaries(instructionSummaries)});
          } else {
            return new InstructionSummariesNotModified();
          }
        })
      );
    })
  );

  transformSummaries(instructionSummaries: RawInstructionSummary[]): InstructionSummary[] {
    let storeInstructionSummaries: any = [];

    storeInstructionSummaries = instructionSummaries;
    storeInstructionSummaries.forEach(summary => {
      summary.guide = this.namePipe.transform(summary.guideId);
    });

    return storeInstructionSummaries;
  }
}
