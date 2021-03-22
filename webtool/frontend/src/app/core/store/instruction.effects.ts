import {Observable, Subject} from 'rxjs';
import {map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {InstructionService} from '../service/instruction.service';
import {
  AddEventInstruction,
  AddInstruction,
  CloneInstruction,
  CreateInstruction,
  DeactivateInstruction,
  DeleteEventInstruction,
  DeleteInstruction,
  InstructionActionTypes,
  InstructionNotModified,
  RequestInstruction,
  UpdateInstruction,
  UpsertInstruction
} from './instruction.actions';
import {Event} from '../../model/event';
import {AppState} from '../../app.state';
import {AddEvent} from './event.actions';
import {Instruction} from './instruction.model';
import {Instruction as RawInstruction} from '../../model/instruction';
import {getEventsByIds} from './event.selectors';
import {RequestInstructionSummaries} from './instruction-summary.actions';
import {Router} from '@angular/router';

function convertDecimal(rawValue: string): number {
  return Number(rawValue);
}

@Injectable({
  providedIn: 'root'
})
export class InstructionEffects {
  events$: Observable<Event[]>;
  private destroySubject = new Subject<void>();

  constructor(private actions$: Actions, private instructionService: InstructionService, private store: Store<AppState>,
              private router: Router) {}

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
      return this.instructionService.cloneInstruction(this.tranformInstructionForSaving(payload.instruction)).pipe(
        map(instruction => {
          if (instruction.id !== 0) {
            this.router.navigate(['instructions', instruction.id]);
            return new RequestInstructionSummaries();
          } else {
            return new InstructionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  deleteInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<DeleteInstruction>(InstructionActionTypes.DeleteInstruction),
    map((action: DeleteInstruction) => action.payload),
    switchMap((payload) => {
      return this.instructionService.deleteInstruction(payload.id).pipe(
        map(instruction => {
          if (instruction === null) {
            return new RequestInstructionSummaries();
          } else {
            return new InstructionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  deactivateInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<DeactivateInstruction>(InstructionActionTypes.DeactivateInstruction),
    map((action: DeactivateInstruction) => action.payload),
    switchMap(payload => {
      return this.instructionService.deactivateInstruction(payload.id).pipe(
        map(instruction => {
          if (instruction.id !== 0) {
            return new RequestInstructionSummaries();
          } else {
            return new InstructionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  createInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<CreateInstruction>(InstructionActionTypes.CreateInstruction),
    map((action: CreateInstruction) => action.payload),
    switchMap(payload => {
      return this.instructionService.createInstruction(payload.topicId, payload.startDate, payload.guideId).pipe(
        map(instruction => {
          if (instruction.topicId !== 0) {
            this.router.navigate(['instructions', instruction.id]);
            return new RequestInstructionSummaries();
          } else {
            return new InstructionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  safeInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<UpsertInstruction>(InstructionActionTypes.UpsertInstruction),
    map((action: UpsertInstruction) => action.payload),
    switchMap(payload  => {
      return this.instructionService.upsertInstruction(this.tranformInstructionForSaving(payload.instruction)).pipe(
        map(instruction => {
          if (instruction.id !== 0) {
            alert('Kurs erfolgreich gespeichert.');
            const instructionInterface = this.transformInstruction(instruction);
            this.store.dispatch(new RequestInstructionSummaries());
            return new UpdateInstruction({instruction: {
              id: instructionInterface.id,
              changes: {...instructionInterface}
            }});
          } else {
            alert('Kurs speichern gescheitert, nocheinmal versuchen oder Seite neuladen.');
            return new InstructionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  addEventInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<AddEventInstruction>(InstructionActionTypes.AddEventInstruction),
    map((action: AddEventInstruction) => action.payload),
    switchMap(payload  => {
      return this.instructionService.addEventInstruction(this.tranformInstructionForSaving(payload.instruction)).pipe(
        map(instruction => {
          if (instruction.id !== 0) {
            const instructionInterface = this.transformInstruction(instruction);
            return new UpdateInstruction({instruction: {
              id: instructionInterface.id,
              changes: {...instructionInterface}
            }});
          } else {
            alert('Event hinzufügen gescheitert, bitte Seite neuladen.');
            return new InstructionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  deleteEventInstruction$: Observable<Action> = this.actions$.pipe(
    ofType<DeleteEventInstruction>(InstructionActionTypes.DeleteEventInstruction),
    map((action: DeleteEventInstruction) => action.payload),
    switchMap(payload  => {
      return this.instructionService.deleteEventInstruction(this.tranformInstructionForSaving(payload.instruction), payload.eventId).pipe(
        map(instruction => {
          if (instruction.id !== 0) {
            const instructionInterface = this.transformInstruction(instruction);
            return new UpdateInstruction({instruction: {
              id: instructionInterface.id,
              changes: {...instructionInterface}
            }});
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

  tranformInstructionForSaving(instructionInterface: Instruction): RawInstruction {
    let instruction: any = {};
    const meetings: any[] = [];
    this.events$ = this.store.select(getEventsByIds([instructionInterface.instructionId, ... instructionInterface.meetingIds])).pipe(
      takeUntil(this.destroySubject),
      tap(events => {
        instruction = events[0];
        events.shift();
        events.forEach(event => meetings.push(event));
      })
    );
    this.events$.subscribe();

    delete instructionInterface.instructionId;
    delete instructionInterface.meetingIds;

    this.destroySubject.complete();

    /* Erase distance of meetings before saving */
    meetings.forEach(meeting => { meeting.distance = 0; });

    return {
      ... instructionInterface,
      instruction,
      meetings,
      admission: String(instructionInterface.admission),
      advances: String(instructionInterface.advances),
      extraCharges: String(instructionInterface.extraCharges)
    };
  }
}
