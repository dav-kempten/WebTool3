import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {TourSummary} from '../../core/store/tour-summary.model';
import {ConfirmationService, MenuItem, SelectItem} from 'primeng/api';
import {AuthService} from '../../core/service/auth.service';
import {FormControl, FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {filter, first, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {RequestTourSummaries} from '../../core/store/tour-summary.actions';
import {getTourSummaries} from '../../core/store/tour-summary.selectors';
import {CloneTour, CreateTour, DeleteTour, RequestTour} from '../../core/store/tour.actions';
import {getTourById} from '../../core/store/tour.selectors';
import {Permission, PermissionLevel} from '../../core/service/permission.service';
import {getStatesOfGroup, States, StatesGroup} from '../../model/value';

@Component({
  selector: 'avk-tour-list',
  templateUrl: './tour-list.component.html',
  styleUrls: ['./tour-list.component.css']
})
export class TourListComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('dt') dt;

  filter: SelectItem[];

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  tours$: Observable<TourSummary[]>;
  activeItem$: Observable<MenuItem>;
  display = false;
  displayclone = false;
  preliminarySelect = false;

  partNewTour = new BehaviorSubject<string>('');

  permissionHandler$: Observable<{staff: boolean, guide: boolean, id: number}>;
  permissionCurrent$: Observable<Permission>;

  categoryIds = new FormControl('');
  startDate = new FormControl('');
  deadline = new FormControl('');
  preliminary = new FormControl(null);

  createTour: FormGroup = new FormGroup({
    categoryIds: this.categoryIds,
    startDate: this.startDate,
    deadline: this.deadline,
    preliminary: this.preliminary
  });

  cloneId = new FormControl(null);
  cloneDate = new FormControl('');

  cloneTour: FormGroup = new FormGroup({
    tourId : this.cloneId,
    startDate: this.cloneDate
  });

  menuItems: MenuItem[] = [
    {label: 'Alle Touren', routerLink: ['/tours']},
    {label: 'Sommertouren', url: '/tours#summer'},
    {label: 'Wintertouren', url: '/tours#winter'},
    {label: 'Jugendtouren', url: '/tours#youth'},
  ];

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService,
              private confirmationService: ConfirmationService) {
    this.filter = [
      {label: 'Aktive Touren', value: {id: 0, name: 'Aktive Touren'}},
      {label: 'Alle Touren', value: {id: 1, name: 'Alle Touren'}},
      {label: 'Fertige Touren', value: {id: 2, name: 'Fertige Touren'}}
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
          case 'youth':
            return this.menuItems[3];
          case 'summer':
            return this.menuItems[1];
          case 'winter':
            return this.menuItems[2];
          default:
            return this.menuItems[0];
        }
      }),
      publishReplay(1),
      refCount()
    );

    this.tours$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      flatMap( part =>
        this.store.pipe(
          select(getTourSummaries),
          tap(tours => {
            if (!tours || !tours.length) {
              this.store.dispatch(new RequestTourSummaries());
            }
          }),
          map(tours =>
            tours.filter(tour =>
              (part === 'winter' && tour.winter) ||
              (part === 'summer' && tour.summer) ||
              (part === 'youth' && tour.youthOnTour) ||
              !part
            )
          ),
          tap(() => this.partNewTour.next(part)),
        )
      ),
      publishReplay(1),
      refCount()
    );

    this.part$.subscribe();
    this.activeItem$.subscribe();
    this.tours$.subscribe();
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

  selectTour(tour): void {
    if (!!tour) {
      this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe( permission => {
        if (permission.permissionLevel >= PermissionLevel.coordinator || permission.guideId === tour.guideId) {
          this.router.navigate(['tours', tour.id]);
        }
      });
    }
  }

  handleClick() {
    this.display = true;
  }

  handleClickClone(tourId) {
    this.displayclone = true;
    this.cloneId.setValue(tourId);
  }

  selectPreliminary() {
    this.preliminarySelect = !this.preliminarySelect;
    if (this.preliminarySelect === false) {
      this.preliminary.setValue(null);
    }
  }

  create(category, startdate, enddate, preliminary) {
    this.permissionCurrent$.pipe(takeUntil(this.destroySubject)).subscribe( permission => {
      const guideId: number = permission.permissionLevel === PermissionLevel.guide ? permission.guideId : null;
      this.store.dispatch(new CreateTour({ categoryId: category, startDate: startdate, deadline: enddate, preliminary, guideId }));
      this.display = false;
    });
  }

  clone(tourId, startDate) {
    this.store.pipe(
      select(getTourById(tourId)),
      tap(tour => {
        if (!tour) {
          this.store.dispatch(new RequestTour({id: tourId}));
        }
      }),
      filter(tour => !!tour),
      first(),
    ).subscribe(
      tour => {
        this.store.dispatch(new CloneTour({tour, startDate}));
      }
    );
    this.displayclone = false;
  }

  confirm(tourId) {
    this.confirmationService.confirm({
      message: 'Tour endgültig löschen?',
      accept: () => {
        this.store.dispatch(new DeleteTour({id: tourId}));
      }
    });
  }

  filterFinishedTours(stateId: number): boolean {
    return getStatesOfGroup(StatesGroup.Finished).indexOf(stateId) === -1;
  }

  changeViewSetActive(event, dt) {
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
      default: break;
    }
  }
}
