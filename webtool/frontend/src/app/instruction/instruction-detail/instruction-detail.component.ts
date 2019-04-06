import {Observable} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';

@Component({
  selector: 'avk-instruction-detail',
  templateUrl: './instruction-detail.component.html',
  styleUrls: ['./instruction-detail.component.css']
})
export class InstructionDetailComponent implements OnInit, OnDestroy {

  instructionId$: Observable<number>;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.instructionId$ = this.store.pipe(select(selectRouterDetailId));
  }

  ngOnDestroy(): void {}

}
