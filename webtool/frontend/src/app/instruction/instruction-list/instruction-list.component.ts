import { Component, OnInit } from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';

@Component({
  selector: 'avk-instruction-list',
  templateUrl: './instruction-list.component.html',
  styleUrls: ['./instruction-list.component.css']
})
export class InstructionListComponent implements OnInit {

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
  }

}
