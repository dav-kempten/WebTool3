import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {Router} from '@angular/router';
import {AuthService, User} from '../../core/service/auth.service';
import {RequestGuideSummaries} from '../../core/store/guide-summary.actions';
import {flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {getGuideSummaries} from '../../core/store/guide-summary.selectors';
import {GuideSummary} from '../../model/guide';

@Component({
  selector: 'avk-guide-list',
  templateUrl: './guide-list.component.html',
  styleUrls: ['./guide-list.component.css']
})
export class GuideListComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  guides$: Observable<GuideSummary[]>;

  authState$: Observable<User>;
  userIsStaff$: Observable<boolean>;
  userIsAdmin$: Observable<boolean>;
  loginObject = {id: undefined, firstName: '', lastName: '', role: undefined, valState: 0};
  partNewGuide = new BehaviorSubject<string>('');

  constructor(private store: Store<AppState>, private router: Router, private userService: AuthService) {
    this.store.dispatch(new RequestGuideSummaries());
  }

  ngOnInit() {
    this.userIsStaff$ = this.userService.isStaff$;
    this.userIsAdmin$ = this.userService.isAdministrator$;


    this.part$ = this.store.pipe(
      takeUntil(this.destroySubject),
      select(selectRouterFragment),
      publishReplay(1),
      refCount()
    );

    this.guides$ = this.part$.pipe(
      takeUntil(this.destroySubject),
      flatMap( part =>
        this.store.pipe(
          select(getGuideSummaries),
          tap(guidesSummaries => {
            if (!guidesSummaries || !guidesSummaries.length) {
              this.store.dispatch(new RequestGuideSummaries());
            }
          }),
          tap(() => this.partNewGuide.next(part)),
        )
      ),
      publishReplay(1),
      refCount()
    );

    this.part$.subscribe();
    this.guides$.subscribe();
  }

  ngOnDestroy() {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  selectGuide(guide): void {
    if (!!guide) {
      if (this.loginObject.valState >= 3 || this.loginObject.id === guide.id) {
        this.router.navigate(['trainers', guide.id]);
      }
    }
  }

}
