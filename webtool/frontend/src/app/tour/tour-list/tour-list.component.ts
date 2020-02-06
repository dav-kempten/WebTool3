import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {TourSummary} from '../../model/tour';
import {MenuItem} from 'primeng/api';
import {AuthService, User} from '../../core/service/auth.service';
import {FormControl, FormGroup} from '@angular/forms';
import {NamesRequested} from '../../core/store/name.actions';
import {ValuesRequested} from '../../core/store/value.actions';
import {CalendarRequested} from '../../core/store/calendar.actions';
import {Router} from '@angular/router';
import {flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {RequestTourSummaries} from '../../core/store/tour-summary.actions';
import {getTourSummaries} from '../../core/store/tour-summary.selectors';
import {CloneTour, CreateTour, DeactivateTour, DeleteTour} from '../../core/store/tour.actions';

@Component({
  selector: 'avk-tour-list',
  templateUrl: './tour-list.component.html',
  styleUrls: ['./tour-list.component.css']
})
export class TourListComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  tours$: Observable<TourSummary[]>;
  activeItem$: Observable<MenuItem>;
  display = false;

  finishedTours = [6, 7, 8];

  partNewTour = new BehaviorSubject<string>('');

  user$: Observable<User>;
  authState$: Observable<User>;
  loginObject = {id: undefined, firstName: '', lastName: '', role: undefined, valState: 0};

  categoryIds = new FormControl('');
  startDate = new FormControl('');
  deadline = new FormControl('');

  createTour: FormGroup = new FormGroup({
    categoryIds: this.categoryIds,
    startDate: this.startDate,
    deadline: this.deadline
  });

  menuItems: MenuItem[] = [
    {label: 'Alle Touren', routerLink: ['/tours']},
    {label: 'Sommertouren', url: '/tours#summer'},
    {label: 'Wintertouren', url: '/tours#winter'},
    {label: 'Jugendtouren', url: '/tours#youth'},
  ];

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService) {
    this.store.dispatch(new NamesRequested());
    this.store.dispatch(new ValuesRequested());
    this.store.dispatch(new CalendarRequested());
  }

  ngOnInit() {
    this.authState$ = this.authService.user$;
    this.authState$.pipe(
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
    ).subscribe();

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

  selectTour(tour): void {
    this.router.navigate(['tours', tour.id]);
  }

  handleClick() {
    this.display = true;
  }

  create(category, startdate, enddate) {
    this.store.dispatch(new CreateTour({categoryId: category, startDate: startdate, deadline: enddate}));
    this.display = false;
  }

  clone(tourId) {
    this.store.dispatch(new CloneTour({id: tourId}));
  }

  delete(tourId) {
    this.store.dispatch(new DeleteTour({id: tourId}));
  }

  deactivate(tourId) {
    this.store.dispatch(new DeactivateTour({id: tourId}));
  }

}
