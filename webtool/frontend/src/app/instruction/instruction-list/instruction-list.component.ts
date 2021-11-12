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
import {AuthService} from '../../core/service/auth.service';
import {
  CloneInstruction,
  CreateInstruction,
  DeleteInstruction,
  RequestInstruction
} from '../../core/store/instruction.actions';
import {FormControl, FormGroup} from '@angular/forms';
import {getInstructionById} from '../../core/store/instruction.selectors';
import {Permission, PermissionLevel} from '../../core/service/permission.service';
import {getStatesOfGroup, States, StatesGroup} from '../../model/value';

@Component({
  selector: 'avk-instruction-list',
  templateUrl: './instruction-list.component.html',
  styleUrls: ['./instruction-list.component.css']
})
export class InstructionListComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('dt') dt;

  filterDropdown: SelectItem[];
  display = false;
  displayclone = false;

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  instructions$: Observable<InstructionSummary[]>;
  activeItem$: Observable<MenuItem>;

  permissionHandler$: Observable<{staff: boolean, guide: boolean, id: number}>;
  permissionCurrent$: Observable<Permission>;

  partNewInstruction = new BehaviorSubject<string>('');

  topicId = new FormControl('');
  startDate = new FormControl('');

  createInstruction: FormGroup = new FormGroup({
    topicId: this.topicId,
    startDate: this.startDate
  });

  cloneId = new FormControl(null);
  cloneStartDate = new FormControl('');
  cloneEndDate = new FormControl('');

  cloneInstruction: FormGroup = new FormGroup({
    instructionId: this.cloneId,
    startDate: this.cloneStartDate,
    endDate: this.cloneEndDate
  });

  menuItems: MenuItem[] = [
    {label: 'Alle Kurse', routerLink: ['/instructions']},
    {label: 'Kletterschule', url: '/instructions#indoor'},
    {label: 'Sommerkurse', url: '/instructions#summer'},
    {label: 'Winterkurse', url: '/instructions#winter'},
  ];

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService,
              private confirmationService: ConfirmationService) {
    this.filterDropdown = [
      {label: 'Aktive Kurse', value: {id: 0, name: 'Aktive Kurse'}},
      {label: 'Alle Kurse', value: {id: 1, name: 'Alle Kurse'}},
      {label: 'Fertige Kurse', value: {id: 2, name: 'Fertige Kurse'}}
    ];
  }

  ngOnInit() {
    this.permissionCurrent$ = this.authService.guidePermission$;

    this.permissionHandler$ = this.permissionCurrent$.pipe(
      takeUntil(this.destroySubject),
      map(permission => {
        return { staff: permission.permissionLevel >= PermissionLevel.coordinator,
          guide: permission.permissionLevel >= PermissionLevel.guide,
          id: permission.guideId
        };
      }),
      publishReplay(1),
      refCount()
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
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngAfterViewInit(): void {
    this.dt.filter(getStatesOfGroup(StatesGroup.Active), 'stateId', 'in');
    this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe(permission => {
      if (permission.guideId !== undefined && permission.permissionLevel === PermissionLevel.guide) {
        this.dt.filter(permission.guideId, 'guideId', 'equals');
      }
    });
  }

  selectInstruction(instruction): void {
    if (!!instruction) {
      this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe( permission => {
        if (permission.permissionLevel >= PermissionLevel.coordinator || permission.guideId === instruction.guideId) {
          this.router.navigate(['instructions', instruction.id]);
        }
      });
    }
  }

  handleClick(): void {
    this.display = true;
  }

  handleClickClone(instructionId): void {
    this.displayclone = true;
    this.cloneId.setValue(instructionId);
  }

  create(topic, date): void {
    this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe( permission => {
      const guideId: number = permission.permissionLevel === PermissionLevel.guide ? permission.guideId : null;
      this.store.dispatch(new CreateInstruction({ topicId: topic, startDate: date, guideId }));
      this.display = false;
    });
  }

  clone(instructionId, startDate, endDate): void {
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
        this.store.dispatch(new CloneInstruction({instruction, startDate, endDate}));
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

  filterFinishedInstructions(stateId: number): boolean {
    return getStatesOfGroup(StatesGroup.Finished).indexOf(stateId) === -1;
  }

  changeViewSet(event, dt) {
    switch (event.value.id) {
      case 0: {
        dt.filter(getStatesOfGroup(StatesGroup.Active), 'stateId', 'in');
        break;
      }
      case 1: {
        dt.filter(getStatesOfGroup(StatesGroup.All), 'stateId', 'in');
        break;
      }
      case 2: {
        dt.filter(States.READY, 'stateId', 'equals');
        break;
      }
      default:
        break;
    }
  }
}
