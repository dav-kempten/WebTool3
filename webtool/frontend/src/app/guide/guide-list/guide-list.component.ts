import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AppState, selectRouterFragment} from '../../app.state';
import {select, Store} from '@ngrx/store';
import {Router} from '@angular/router';
import {AuthService, User} from '../../core/service/auth.service';
import {filter, flatMap, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {GuideSummary} from '../../model/guide';
import {getGuideSummaries} from '../../core/store/guide-summary.selectors';
import {RequestGuideSummaries} from '../../core/store/guide-summary.actions';

@Component({
  selector: 'avk-guide-list',
  templateUrl: './guide-list.component.html',
  styleUrls: ['./guide-list.component.css']
})
export class GuideListComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('dt') dt;

  private destroySubject = new Subject<void>();

  guides$: Observable<GuideSummary[]>;

  authState$: Observable<User>;
  authChangeSubject = new BehaviorSubject<any>(undefined);
  authChange$: Observable<any> = this.authChangeSubject.asObservable();
  loginObject = {id: undefined, firstName: '', lastName: '', role: undefined, valState: 0};

  constructor(private store: Store<AppState>, private router: Router, private userService: AuthService) { }

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

    this.guides$ = this.store.pipe(
      takeUntil(this.destroySubject),
      select(getGuideSummaries),
          tap(guidesSummaries => {
            if (!guidesSummaries || !guidesSummaries.length) {
              this.store.dispatch(new RequestGuideSummaries());
            }
          }),
    );

    this.guides$.subscribe();

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
    this.authChange$.subscribe(
      value => {
        if (value.id !== undefined && value.role === 'Trainer') {
          this.dt.filter(value.id, 'id', 'equals');
        }
      }
    );
  }

  selectGuide(guide): void {
    if (!!guide) {
      if (this.loginObject.valState >= 2 || this.loginObject.id === guide.id) {
        this.router.navigate(['trainers', guide.id]);
      }
    }
  }

}
