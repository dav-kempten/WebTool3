import {Observable} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {FormControl, FormGroup} from "@angular/forms";
import {NameListRequested} from "../../core/store/name.actions";

@Component({
  selector: 'avk-instruction-detail',
  "styles": ["node_modules/primeflex/primeflex.css"],
  templateUrl: './instruction-detail.component.html',
  styleUrls: ['./instruction-detail.component.css']
})
export class InstructionDetailComponent implements OnInit, OnDestroy {

  instructionId$: Observable<number>;

  guide = new FormControl('');
  team = new FormControl('');
  instructionForm = new FormGroup({
    guide: this.guide,
    team: this.team
  });

  description = new FormControl('');
  notes = new FormControl('');

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new NameListRequested());
  }

  ngOnInit(): void {
    this.instructionId$ = this.store.pipe(select(selectRouterDetailId));

    this.instructionForm.setValue({
      guide: '',
      team: ''
    });
  }

  ngOnDestroy(): void {}

}
