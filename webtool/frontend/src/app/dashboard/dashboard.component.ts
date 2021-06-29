import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../app.state';
import {AuthService} from '../core/service/auth.service';
import {FormControl, FormGroup} from '@angular/forms';
import {CreateTour} from '../core/store/tour.actions';
import {map, publishReplay, refCount, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {CreateInstruction} from '../core/store/instruction.actions';
import {Permission, PermissionLevel} from '../core/service/permission.service';

@Component({
  selector: 'avk-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroySubject: Subject<boolean> = new Subject<boolean>();

  permissionHandler$: Observable<boolean>;
  permissionCurrent$: Observable<Permission>;

  preliminarySelect = new BehaviorSubject<boolean>(false);

  categoryIds = new FormControl('');
  startDateTour = new FormControl('');
  deadlineTour = new FormControl('');
  preliminary = new FormControl(null);

  topicId = new FormControl('');
  startDateInstruction = new FormControl('');

  createTour: FormGroup = new FormGroup({
    categoryIds: this.categoryIds,
    startDate: this.startDateTour,
    deadline: this.deadlineTour,
    preliminary: this.preliminary
  });

  createInstruction: FormGroup = new FormGroup({
    topicId: this.topicId,
    startDate: this.startDateInstruction
  });

  constructor(private store: Store<AppState>, private authService: AuthService) { }

  ngOnInit() {
    this.permissionCurrent$ = this.authService.guidePermission$;

    this.permissionHandler$ = this.permissionCurrent$.pipe(
      takeUntil(this.destroySubject),
      map(permission => permission.permissionLevel >= PermissionLevel.guide),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.permissionCurrent$.subscribe();
    this.permissionHandler$.subscribe();
    this.preliminarySelect.subscribe( preliminary => {
      if (preliminary) { this.preliminary.setValue(null); }
    });
  }

  ngOnDestroy() {
    this.destroySubject.next(true);
    this.destroySubject.unsubscribe();
  }

  selectPreliminary() {
    this.preliminarySelect.next(!this.preliminarySelect.value);
  }

  creatingTour(category, startdate, enddate, preliminary) {
    this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe(permission => {
      const guideId = permission.permissionLevel >= PermissionLevel.coordinator ? null : permission.guideId;
      this.store.dispatch(new CreateTour({
        categoryId: category, startDate: startdate, deadline: enddate, preliminary, guideId
      }));
    }).unsubscribe();
  }

  creatingInstruction(topic, startdate) {
    this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe(permission => {
      const guideId = permission.permissionLevel >= PermissionLevel.coordinator ? null : permission.guideId;
      this.store.dispatch(new CreateInstruction({
        topicId: topic, startDate: startdate, guideId
      }));
    }).unsubscribe();
  }

}
