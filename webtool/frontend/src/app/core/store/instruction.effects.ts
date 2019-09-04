import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {InstructionService} from '../service/instruction.service';
import {
  AddInstruction,
  CloneInstruction,
  InstructionActionTypes,
  InstructionNotModified,
  RequestInstruction
} from './instruction.actions';
import {Event} from '../../model/event';
import {AppState} from '../../app.state';
import {AddEvent} from './event.actions';
import {Instruction} from './instruction.model';
import {Instruction as RawInstruction} from '../../model/instruction';

function convertDecimal(rawValue: string): number {
  return Number(rawValue.replace('.', ''));
}

@Injectable({
  providedIn: 'root'
})
export class InstructionEffects {

  constructor(private actions$: Actions, private instructionService: InstructionService, private store: Store<AppState>) {}

  @Effect()
  loadInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<RequestInstruction>(InstructionActionTypes.RequestInstruction),
    map((action: RequestInstruction) => action.payload),
    switchMap(payload => {
      return this.instructionService.getInstruction(payload.id).pipe(
        map(instruction => {
          if (instruction.id !== 0) {
            return new AddInstruction({instruction: this.transformInstruction(instruction)});
          } else {
            return new InstructionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  cloneInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<CloneInstruction>(InstructionActionTypes.CloneInstruction),
    map((action: CloneInstruction) => action.payload),
    switchMap(payload => {
      return this.instructionService.cloneInstruction(payload.id).pipe(
        map(instruction => {
          if (instruction.id !== 0) {
            return new AddInstruction({instruction: this.transformInstruction(instruction)});
          } else {
            return new InstructionNotModified();
          }
        })
      );
    })
  );

  transformInstruction(instruction: RawInstruction): Instruction {
    const instructionId = instruction.id;
    let meetingIds: number[];

    this.store.dispatch(new AddEvent({event: instruction.instruction}));
    meetingIds = instruction.meetings.map((event: Event): number => {
      this.store.dispatch(new AddEvent({event}));
      return event.id;
    });

    delete instruction.instruction;
    delete instruction.meetings;

    return {
      ... instruction,
      instructionId,
      meetingIds,
      admission: convertDecimal(instruction.admission),
      advances: convertDecimal(instruction.advances),
      extraCharges: convertDecimal(instruction.extraCharges)
    };
  }
}
