import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {ControlValueAccessor, FormControl, FormControlName, FormGroup, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Dropdown} from 'primeng/dropdown';
import {BehaviorSubject, Observable, ReplaySubject, Subject, Subscription} from 'rxjs';
import {Skill as RawSkill} from '../../model/value';
import {State as SkillState} from '../store/skill.reducer';
import {stateValidator} from '../dropdown/dropdown.component';
import {Store} from '@ngrx/store';
import {AppState} from '../../app.state';
import {getSkillState} from '../store/value.selectors';
import {delay, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';

@Component({
  selector: 'avk-skillselect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SkillselectComponent),
      multi: true
    }
  ],
  templateUrl: './skillselect.component.html',
  styleUrls: ['./skillselect.component.css']
})
export class SkillselectComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, ControlValueAccessor {

  @ViewChild(Dropdown) dropdown: Dropdown;
  @ContentChild(FormControlName) formControlNameRef: FormControlName;
  formControl: FormControl;
  delegatedMethodCalls = new ReplaySubject<(_: ControlValueAccessor) => void>();
  delegatedMethodsSubscription: Subscription;
  private destroySubject = new Subject<void>();
  skillSubject = new BehaviorSubject<RawSkill[]>(undefined);

  originalControl = new FormControl(null);
  choiceControl = new FormControl('');

  formState$: Observable<SkillState>;
  formStateComponent$: Observable<SkillState>;

  readonly = false;
  editable = false;

  @Input()
  set readOnly(value: boolean) {
    this.readonly = value;
  }

  @Input()
  set editAble(value: boolean) {
    this.editable = value;
  }

  group = new FormGroup(
    {
      original: this.originalControl,
      choice: this.choiceControl,
    },
    [stateValidator]
  );

  status: RawSkill[] = new Array(1).fill({id: 0, level: null, categoryId: null, code: 'Skills',
    description: null});


  OnChangeWrapper(onChange: (stateIn) => void): (stateOut: RawSkill) => void {
    return ((state: RawSkill): void => {
      this.formControl.setValue(state);
      this.choiceControl.setValue(state);
      onChange(state.id);
    });
  }

  registerOnChange(fn: any): void {
    this.delegatedMethodCalls.next(accessor => accessor.registerOnChange(this.OnChangeWrapper(fn)));
  }

  registerOnTouched(fn: any): void {
    this.delegatedMethodCalls.next(accessor => accessor.registerOnTouched(fn));
  }

  setDisabledState(isDisabled: boolean): void {
    this.delegatedMethodCalls.next(accessor => accessor.setDisabledState(isDisabled));
  }

  writeValue(stateId): void {
    if (typeof stateId === 'number') {
      for (const el in this.status) {
        if (stateId === this.status[el].id) {
          stateId = this.status[el];
        }
      }
    }
    this.delegatedMethodCalls.next(accessor => accessor.writeValue(stateId));
  }

  constructor(private store: Store<AppState>) { }

  ngOnInit(): void {
    this.formState$ = this.store.select(getSkillState);

    this.formStateComponent$ = this.formState$.pipe(
      takeUntil(this.destroySubject),
      tap( state => {
        Object.keys(state.entities).forEach( key => {
          console.log(this.status);
          this.status.push(state.entities[key]);
    //       switch (this.topicKeyword) {
    //         case 'instruction': {
    //           if (state.entities[key].instruction) {
    //             this.status.push(state.entities[key]);
    //           }
    //           break;
    //         }
    //         case 'talk': {
    //           if (state.entities[key].talk) {
    //             this.status.push(state.entities[key]);
    //           }
    //           break;
    //         }
    //         case 'tour': {
    //           if (state.entities[key].tour) {
    //             this.status.push(state.entities[key]);
    //           }
    //           break;
    //         }
    //         default: {
    //           break;
    //         }
    //       }
        });
    //     this.filterBySeason(this.status, this.seasonKeyword);
      }),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );
    this.formStateComponent$.subscribe();

    this.skillSubject.next(this.status);
  }

  ngAfterViewInit(): void {
    this.delegatedMethodsSubscription = this.delegatedMethodCalls.pipe(
      delay(0),
    ).subscribe(fn => fn(this.dropdown));
  }

  ngOnDestroy(): void {
    if (this.delegatedMethodsSubscription) {
      this.delegatedMethodsSubscription.unsubscribe();
    }
    this.destroySubject.next();
    this.destroySubject.complete();
    this.skillSubject.complete();
  }

  ngAfterContentInit(): void {
    this.formControl = this.formControlNameRef.control;
    this.originalControl.setValue(this.formControl);
    this.choiceControl.setValue(this.formControl.value);
  }
}
