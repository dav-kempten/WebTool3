import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {InstructionSummary} from '../../model/instruction';
import {getInstructionSummaries} from '../../core/store/instruction-summary.selectors';
import {RequestInstructionSummaries} from '../../core/store/instruction-summary.actions';
import {filter, first, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {ConfirmationService, MenuItem, SelectItem} from 'primeng/api';
import {AuthService, User} from '../../core/service/auth.service';
import {
  CloneInstruction,
  CreateInstruction,
  DeactivateInstruction,
  DeleteInstruction,
  RequestInstruction
} from '../../core/store/instruction.actions';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {getInstructionById} from '../../core/store/instruction.selectors';

@Component({
  selector: 'avk-instruction-list',
  templateUrl: './instruction-list.component.html',
  styleUrls: ['./instruction-list.component.css']
})
export class InstructionListComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('dt') dt;

  filterDropdown: SelectItem[];

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  instructions$: Observable<InstructionSummary[]>;
  activeItem$: Observable<MenuItem>;
  display = false;

  finishedInstructions = [6, 7];
  activeInstructions = [1, 2, 3, 4, 5, 8, 9];
  allInstructions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  partNewInstruction = new BehaviorSubject<string>('');

  user$: Observable<User>;
  authState$: Observable<User>;
  authChangeSubject = new BehaviorSubject<any>(undefined);
  authChange$: Observable<any> = this.authChangeSubject.asObservable();
  loginObject = {id: undefined, firstName: '', lastName: '', role: undefined, valState: 0};

  topicId = new FormControl('');
  startDate = new FormControl('');

  createInstruction: FormGroup = new FormGroup({
    topicId: this.topicId,
    startDate: this.startDate
  });

  menuItems: MenuItem[] = [
    {label: 'Alle Kurse', routerLink: ['/instructions']},
    {label: 'Kletterschule', url: '/instructions#indoor'},
    {label: 'Sommerkurse', url: '/instructions#summer'},
    {label: 'Winterkurse', url: '/instructions#winter'},
  ];

  constructor(private store: Store<AppState>, private router: Router, private userService: AuthService,
              private confirmationService: ConfirmationService) {
    this.filterDropdown = [
      {label: 'Aktive Kurse', value: {id: 0, name: 'Aktive Kurse'}},
      {label: 'Alle Kurse', value: {id: 1, name: 'Alle Kurse'}},
      {label: 'Fertige Kurse', value: {id: 2, name: 'Fertige Kurse'}}
    ];
  }

  ngOnInit() {
    this.authState$ = this.userService.user$;

    this.authState$.pipe(
      takeUntil(this.destroySubject),
      tap(value => {
        this.loginObject = { ...value, valState: 0 };
        if (value.role === 'Administrator') {
          this.loginObject.valState = 4;
        } else if (value.role === 'Geschäftsstelle') {
          this.loginObject.valState = 3;
        } else if (value.role === 'Fachbereichssprecher') {
          this.loginObject.valState = 2;
        } else if (value.role === 'Trainer') {
          this.loginObject.valState = 1;
        } else { this.loginObject.valState = 0; }
      }),
    ).subscribe(
      value => {
        this.authChangeSubject.next(value);
      }
    );

    this.part$ = this.store.pipe(
      takeUntil(this.destroySubject),
      select(selectRouterFragment),
      publishReplay(1),
      refCount()
    );

    this.activeItem$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      map(part => {
        switch (part) {
          case 'indoor':
            return this.menuItems[1];
          case 'summer':
            return this.menuItems[2];
          case 'winter':
            return this.menuItems[3];
          default:
            return this.menuItems[0];
        }
      }),
      publishReplay(1),
      refCount()
    );

    this.instructions$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      flatMap( part =>
        this.store.pipe(
          select(getInstructionSummaries),
          tap(instructions => {
            if (!instructions || !instructions.length) {
              this.store.dispatch(new RequestInstructionSummaries());
            }
          }),
          map(instructions =>
            instructions.filter(instruction =>
              (part === 'winter' && instruction.winter) ||
              (part === 'summer' && instruction.summer) ||
              (part === 'indoor' && instruction.indoor) ||
              !part
            )
          ),
          tap(() => this.partNewInstruction.next(part)),
        )
      ),
      publishReplay(1),
      refCount()
    );

    this.part$.subscribe();
    this.activeItem$.subscribe();
    this.instructions$.subscribe();

    this.authChange$.pipe(
      takeUntil(this.destroySubject),
      filter(user => !!user),
      publishReplay(1),
      refCount(),
    );
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngAfterViewInit(): void {
    this.dt.filter(this.activeInstructions, 'stateId', 'in');
    this.authChange$.subscribe(
      value => {
        if (value.id !== undefined && value.role === 'Trainer') {
          this.dt.filter(value.id, 'guideId', 'equals');
        }
      }
    );
  }

  selectInstruction(instruction): void {
    if (!!instruction) {
      if (this.loginObject.valState >= 2 || this.loginObject.id === instruction.guideId) {
        this.router.navigate(['instructions', instruction.id]);
      }
    }
  }

  handleClick() {
    this.display = true;
  }

  create(topic, date) {
    let guideId: number;
    if (this.loginObject.valState === 1) {
      guideId = this.loginObject.id;
    } else {
      guideId = null;
    }
    this.store.dispatch(new CreateInstruction({
      topicId: topic, startDate: date, guideId
    }));
    this.display = false;
  }

  clone(instructionId) {
    this.store.pipe(
      select(getInstructionById(instructionId)),
      tap(instruction => {
        if (!instruction) {
          this.store.dispatch(new RequestInstruction({id: instructionId}));
        }
      }),
      filter(instruction => !!instruction),
      first(),
    ).subscribe(
      instruction => {
        this.store.dispatch(new CloneInstruction({instruction}));
      }
    );
  }

  confirm(instructionId) {
    this.confirmationService.confirm({
      message: 'Kurstermin endgültig löschen?',
      accept: () => {
        this.store.dispatch(new DeleteInstruction({id: instructionId}));
      }
    });
  }

  changeViewSet(event, dt) {
    switch (event.value.id) {
      case 0: {
        dt.filter(this.activeInstructions, 'stateId', 'in');
        break;
      }
      case 1: {
        dt.filter(this.allInstructions, 'stateId', 'in');
        break;
      }
      case 2: {
        dt.filter(2, 'stateId', 'equals');
        break;
      }
      default:
        break;
    }
  }
}
