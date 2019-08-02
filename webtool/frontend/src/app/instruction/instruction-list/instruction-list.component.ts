import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {Observable, Subject} from 'rxjs';
import {InstructionSummary} from '../../model/instruction';
import {getInstructionSummaries} from '../../core/store/instruction-summary.selectors';
import {RequestInstructionSummaries} from '../../core/store/instruction-summary.actions';
import {flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {MenuItem} from 'primeng/api';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from "../../core/store/value.actions";
import {AuthService, User} from "../../core/service/auth.service";
import {
  CloneInstruction,
  CreateInstruction,
  DeactivateInstruction,
  DeleteInstruction
} from "../../core/store/instruction.actions";
import {FormControl, FormGroup} from "@angular/forms";

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
  display: boolean = false;

  user$: Observable<User>;

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

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
  }

  ngOnInit() {
    this.user$ = this.authService.user$;
    this.user$.pipe(
      tap(value => console.log(value)),
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
          )
        )
      ),
      publishReplay(1),
      refCount()
    );

    this.user$.subscribe();
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
    console.log("this.display: ", this.display);
  }

  confirmClick() {
    console.log("TopicId",this.createInstruction.get('topicId').value);
    console.log("StartDate",this.createInstruction.get('startDate').value);
    this.store.dispatch(new CreateInstruction({topicId: this.createInstruction.get('topicId').value,
      startDate: this.createInstruction.get('startDate').value}));
  }

  clone(instructionId) {
    console.log("clone", instructionId);
    this.store.dispatch(new CloneInstruction({id: instructionId}));
  }

  delete(instructionId) {
    console.log("delete", instructionId);
    this.store.dispatch(new DeleteInstruction({id: instructionId}));
  }

  deactivate(instructionId) {
    console.log("deactivate", instructionId);
    this.store.dispatch(new DeactivateInstruction({id: instructionId}))
  }
}
