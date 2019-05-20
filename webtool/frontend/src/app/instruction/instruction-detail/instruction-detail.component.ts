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

interface Tour {
  type;
  sdate;
  stime;
  edate;
  etime;
  shorttitle;
  longtitle;
  location;
}

interface Costs {
  pos;
  beschreibung;
  betrag;
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
  numbermembermin = new FormControl('');
  numbermembermax = new FormControl('');
  distance = new FormControl('');
  service = new FormControl('');
  tourcosts = new FormControl('');
  costsname = new FormControl('');
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
    numbermembermin: this.numbermembermin,
    numbermembermax: this.numbermembermax,
    distance: this.distance,
    service: this.service,
    tourcosts: this.tourcosts,
    costsname: this.costsname,
    extracosts: this.extracosts,
    deposit: this.deposit,
    memberfee: this.memberfee
  });

  equipmentChoice: Equipment[];
  requirementChoice: Requirements[];
  tours: Tour[];
  totalcosts: Costs[];
  totalcostsCtr: number = 0;

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
      numbermembermin: '',
      numbermembermax: '',
      distance: '',
      service: '',
      tourcosts: '',
      costsname: '',
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

    this.tours = [
      {type:"Bergtour", sdate:"26-07-2019", stime:"1700", edate:"27-07-2019", etime:"1700",
        shorttitle:"Rangiswanger Horn", longtitle:"", location:"Gunzesried"},
      {type:"Hochtour", sdate:"28-07-2019", stime:"1500", edate:"29-07-2019", etime:"1800",
        shorttitle:"Großer Wilder", longtitle:"", location:"Pitztal"},
      {type:"Klettertour", sdate:"17-07-2019", stime:"1200", edate:"29-07-2019", etime:"700",
        shorttitle:"Aggenstein", longtitle:"", location:"Tannheimer Tal"},
      {type:"MTB-Tour", sdate:"27-07-2019", stime:"1430", edate:"29-07-2019", etime:"2000",
        shorttitle:"Sonthofen", longtitle:"", location:"Allgäu"}
    ];

    this.totalcosts = [];
  }

  ngOnDestroy(): void {}

  getTourCosts(): void {
    let varCost: Costs =  {pos: 0, betrag: 0, beschreibung: 0};

    if (this.costsname.value !== '' && this.tourcosts.value !== '') {
      varCost.pos = ++this.totalcostsCtr;
      varCost.beschreibung = this.costsname.value;
      varCost.betrag = this.tourcosts.value;
      this.totalcosts.push(varCost);
    }
  }

}
