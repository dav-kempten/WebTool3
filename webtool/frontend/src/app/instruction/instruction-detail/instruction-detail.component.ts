import {Observable} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {NameListRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {CalendarRequested} from '../../core/store/calendar.actions';
import {RequestInstruction} from '../../core/store/instruction.actions';
import {getInstructionById, getInstructionIsLoading} from '../../core/store/instruction.selectors';
import {Instruction} from '../../core/store/instruction.model';
import {flatMap, map, tap} from 'rxjs/operators';
import {getTopicById} from '../../core/store/value.selectors';
import {AuthService} from '../../core/service/auth.service';
import {getEventsByIds} from '../../core/store/event.selectors';
import {Event} from '../../model/event';
import {Topic} from '../../model/value';

@Component({
  selector: 'avk-instruction-detail',
  templateUrl: './instruction-detail.component.html',
  styleUrls: ['./instruction-detail.component.css']
})

export class InstructionDetailComponent implements OnInit {

  instructionId$: Observable<number>;
  isLoading$: Observable<boolean>;
  instruction$: Observable<Instruction>;
  topic$: Observable<Topic>;
  eventIds$: Observable<number[]>;
  events$: Observable<Event[]>;

  constructor(private store: Store<AppState>, private userService: AuthService) {
    this.store.dispatch(new NameListRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit(): void {

    this.instructionId$ = this.store.select(selectRouterDetailId);

    this.isLoading$ = this.store.select(getInstructionIsLoading);

    this.instruction$ = this.instructionId$.pipe(
      flatMap(id => this.store.pipe(
        select(getInstructionById(id)),
        tap(instruction => {
          if (!instruction) {
            this.store.dispatch(new RequestInstruction({id}));
          }
        })
      ))
    );

    this.topic$ = this.instruction$.pipe(
      flatMap( instruction => this.store.pipe(
        select(getTopicById(instruction.topicId)),
        tap(topic => {
          if (!topic) {
            this.store.dispatch((new ValuesRequested()));
          }
        })
      ))
    );

    this.eventIds$ = this.instruction$.pipe(
      map(instruction => [instruction.instructionId, ...instruction.meetingIds])
    );

    this.events$ = this.eventIds$.pipe(
      flatMap(eventIds => this.store.select(getEventsByIds(eventIds)))
    );

  }
}
