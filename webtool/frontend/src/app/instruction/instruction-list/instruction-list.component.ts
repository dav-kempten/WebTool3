import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {Observable, pipe} from 'rxjs';
import {InstructionSummary} from '../../model/instruction';
import {getInstructionSummaries} from '../../core/store/instruction-summary.selectors';
import {RequestInstructionSummaries} from '../../core/store/instruction-summary.actions';
import {filter, flatMap, map, publishLast, refCount, switchMap, tap} from "rxjs/operators";

@Component({
  selector: 'avk-instruction-list',
  templateUrl: './instruction-list.component.html',
  styleUrls: ['./instruction-list.component.css']
})
export class InstructionListComponent implements OnInit {

  category$: Observable<string>;
  instructions$: Observable<InstructionSummary[]>;

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
    this.category$ = this.store.select(selectRouterFragment);
    this.instructions$ = this.category$.pipe(
      flatMap( category =>
        this.store.pipe(
          select(getInstructionSummaries),
          tap(instructions => {
            if (!instructions || !instructions.length) {
              this.store.dispatch(new RequestInstructionSummaries());
            }
          }),
          map(instructions =>
            instructions.filter(instruction =>
              (category === 'winter' && instruction.winter) ||
              (category === 'summer' && instruction.summer) ||
              (category === 'indoor' && instruction.indoor) ||
              !category
            )
          )
        )
      )
    );
  }

}
