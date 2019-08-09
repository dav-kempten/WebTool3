import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {Observable, Subject} from 'rxjs';
import {InstructionSummary} from '../../model/instruction';
import {getInstructionSummaries} from '../../core/store/instruction-summary.selectors';
import {RequestInstructionSummaries} from '../../core/store/instruction-summary.actions';
import {filter, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {MenuItem} from 'primeng/api';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {AuthService, User} from '../../core/service/auth.service';
import {
  CloneInstruction,
  CreateInstruction,
  DeactivateInstruction,
  DeleteInstruction
} from '../../core/store/instruction.actions';
import {FormControl, FormGroup} from '@angular/forms';
import {Category} from '../../model/value';
import {CalendarRequested} from '../../core/store/calendar.actions';

@Component({
  selector: 'avk-instruction-list',
  templateUrl: './instruction-list.component.html',
  styleUrls: ['./instruction-list.component.css']
})
export class InstructionListComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  instructions$: Observable<InstructionSummary[]>;
  activeItem$: Observable<MenuItem>;
  display = false;
  finishedInstructions = [6, 7, 8];

  user$: Observable<User>;
  authState$: Observable<User>;
  userValState = 0;

  topicId = new FormControl('');
  startDate = new FormControl('');

  createInstruction: FormGroup = new FormGroup({
    topicId: this.topicId,
    startDate: this.startDate
  });

  menuItems: MenuItem[] = [
    {label: 'Alle Kurse', routerLink: ['/instructions']},
    {label: 'Kletterschule', url: '/instructions#indoor'},
    {label: 'Sommer Kurse', url: '/instructions#summer'},
    {label: 'Winter Kurse', url: '/instructions#winter'},
  ];

  category$: Observable<Category>;

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit() {
    this.authState$ = this.authService.user$;
    this.authState$.pipe(
      tap(value => {
        if (value.role === 'Administrator') {
          this.userValState = 4;
        } else if (value.role === 'Geschäftsstelle') {
          this.userValState = 3;
        } else if (value.role === 'Fachbereichssprecher') {
          this.userValState = 2;
        } else if (value.role === 'Trainer') {
          this.userValState = 1;
        } else { this.userValState = 0; }
      }),
    ).subscribe();

    // this.part$ = this.store.select(selectRouterFragment);

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
          )
        )
      ),
      publishReplay(1),
      refCount()
    );

    // this.category$ = this.part$.pipe(
    //   takeUntil(this.destroySubject),
    //   filter(topic => !!topic),
    //   flatMap(topic => this.store.pipe(
    //
    //   ))
    // );

    this.part$.subscribe();
    this.activeItem$.subscribe();
    this.instructions$.subscribe();

    }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  selectInstruction(instruction): void {
    this.router.navigate(['instructions', instruction.id]);
  }

  handleClick() {
    this.display = true;
  }

  confirmClick() {
    this.store.dispatch(new CreateInstruction({topicId: this.createInstruction.get('topicId').value,
      startDate: this.createInstruction.get('startDate').value}));
    this.display = false;
  }

  clone(instructionId) {
    this.store.dispatch(new CloneInstruction({id: instructionId}));
  }

  delete(instructionId) {
    this.store.dispatch(new DeleteInstruction({id: instructionId}));
  }

  deactivate(instructionId) {
    this.store.dispatch(new DeactivateInstruction({id: instructionId}));
  }
}
