import {Observable} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {Instruction} from '../../core/store/instruction.model';
import {flatMap, map, tap} from 'rxjs/operators';
import {getInstructionById} from '../../core/store/instruction.selectors';
import {RequestInstruction} from '../../core/store/instruction.actions';
import {getEventsByIds} from '../../core/store/event.selectors';
import {Event} from '../../model/event';

@Component({
  selector: 'avk-instruction-detail',
  templateUrl: './instruction-detail.component.html',
  styleUrls: ['./instruction-detail.component.css']
})
export class InstructionDetailComponent implements OnInit, OnDestroy {

  instructionId$: Observable<number>;
  instruction$: Observable<Instruction>;
  eventIds$: Observable<number[]>;
  events$: Observable<Event[]>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.instructionId$ = this.store.select(selectRouterDetailId);
    this.instruction$ = this.instructionId$.pipe(
      flatMap(id => this.store.pipe(
          select(getInstructionById(id)),
          tap(instruction => {
            if (!instruction) {
              this.store.dispatch(new RequestInstruction({id}));
            }
          })
        )
      )
    );
    this.eventIds$ = this.instruction$.pipe(
      map(instruction => [instruction.instructionId, ...instruction.meetingIds])
    );
    this.events$ = this.eventIds$.pipe(
      flatMap(eventIds => this.store.select(getEventsByIds(eventIds)))
    );
  }

  ngOnDestroy(): void {}

}
