import {Observable} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {FormControl, FormGroup} from "@angular/forms";
import {NameListRequested} from "../../core/store/name.actions";

interface Equipment {
  name: string;
  details: string[];
}

interface Requirements {
  name: string;
}

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
  costs = new FormControl('');
  revenue = new FormControl('');
  description = new FormControl('');
  notes = new FormControl('')
  bookingnr = new FormControl('');
  status = new FormControl('');
  concept = new FormControl('');
  shorttitle = new FormControl('');
  longtitle = new FormControl('');
  equipment = new FormControl( '');
  requirement = new FormControl('');
  numbermember = new FormControl('');
  distance = new FormControl('');
  service = new FormControl('');
  tourcosts = new FormControl('');
  extracosts = new FormControl('');
  deposit = new FormControl('');
  memberfee = new FormControl('');

  instructionForm = new FormGroup({
    guide: this.guide,
    team: this.team,
    costs: this.costs,
    revenue: this.revenue,
    description: this.description,
    notes: this.notes,
    bookingnr: this.bookingnr,
    status: this.status,
    concept: this.concept,
    shorttitle: this.shorttitle,
    longtitle: this.longtitle,
    equipment: this.equipment,
    requirement: this.requirement,
    numbermember: this.numbermember,
    distance: this.distance,
    service: this.service,
    tourcosts: this.tourcosts,
    extracosts: this.extracosts,
    deposit: this.deposit,
    memberfee: this.memberfee
  });

  equipmentChoice: Equipment[];
  requirementChoice: Requirements[];

  constructor(private store: Store<AppState>) {
    this.store.dispatch(new NameListRequested());
  }

  ngOnInit(): void {
    this.instructionId$ = this.store.pipe(select(selectRouterDetailId));

    this.instructionForm.setValue({
      guide: '',
      team: '',
      costs: '',
      revenue: '',
      description: '',
      notes: '',
      bookingnr: '',
      status: '',
      concept: '',
      shorttitle: '',
      longtitle: '',
      equipment: '',
      requirement: '',
      numbermember: '',
      distance: '',
      service: '',
      tourcosts: '',
      extracosts: '',
      deposit: '',
      memberfee: ''
    });

    this.equipmentChoice = [
      {name: 'Bergtour', details:['Schuhe', 'Regenjacke', 'Brotzeit']},
      {name: 'Gletscher', details:['Schuhe', 'Regenjacke', 'Steigeisen']},
      {name: 'Klettern', details:['Schuhe', 'Seil', 'Helm']},
      {name: 'Mountainbiken', details:['Schuhe', 'Fahrrad', 'Helm']}
    ];

    this.requirementChoice = [
      {name:"Grundkurs Alpin"}, {name:"Grundkurs Klettern"}, {name:"Vorstiegsschein"}, {name:"Grundkurs Hochtouren"}
    ];
  }

  ngOnDestroy(): void {}

}
