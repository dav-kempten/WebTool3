import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterFragment} from '../../app.state';
import {Router} from '@angular/router';
import {AuthService} from '../../core/service/auth.service';
import {GuidesRequested} from '../../core/store/guide.actions';
import {flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {getGuides} from '../../core/store/guide.selectors';
import {Guide} from '../../model/guide';

@Component({
  selector: 'avk-guide-list',
  templateUrl: './guide-list.component.html',
  styleUrls: ['./guide-list.component.css']
})
export class GuideListComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  part$: Observable<string>;
  guides$: Observable<Guide[]>;

  partNewGuide = new BehaviorSubject<string>('');

  constructor(private store: Store<AppState>, private router: Router, private authService: AuthService) {
    this.store.dispatch(new GuidesRequested());
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
          select(getGuides),
          tap(guides => {
            if (!guides || !guides.length) {
              this.store.dispatch(new GuidesRequested());
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
    // this.router.navigate(['guides', guide.id]);
  }

}
