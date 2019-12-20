import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {Router} from '@angular/router';
import {AuthService} from '../../core/service/auth.service';
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

  partNewGuide = new BehaviorSubject<string>('');

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService) {
    this.store.dispatch(new RequestGuideSummaries());
  }

  ngOnInit() {

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
    this.router.navigate(['trainers', guide.id]);
  }

}
