import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, ElementRef, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormControl, FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
import {Guide} from '../../model/guide';
import {flatMap, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getGuideById} from '../../core/store/guide.selectors';
import {RequestGuide} from '../../core/store/guide.actions';

@Component({
  selector: 'avk-guide-detail',
  templateUrl: './guide-detail.component.html',
  styleUrls: ['./guide-detail.component.css'],
})
export class GuideDetailComponent implements OnInit {

  private destroySubject = new Subject<void>();
  private guideSubject = new BehaviorSubject<FormGroup>(undefined);
  private guideChangeSubject = new BehaviorSubject<Guide>(undefined);

  guideGroup$: Observable<FormGroup> = this.guideSubject.asObservable();

  guideId$: Observable<number>;
  guide$: Observable<Guide>;

  constructor(private store: Store<AppState>) {
    // this.store.dispatch(new GuidesRequested());
  }

  ngOnInit(): void {

    this.guideId$ = this.store.select(selectRouterDetailId);

    this.guide$ = this.guideId$.pipe(
      takeUntil(this.destroySubject),
      flatMap(id => this.store.pipe(
        select(getGuideById(id)),
        tap(guide => {
          if (!guide) {
            this.store.dispatch(new RequestGuide({id}));
          } else {
            const guideGroup = guideGroupFactory(guide);
            guideGroup.valueChanges.pipe(
              takeUntil(this.destroySubject)
            ).subscribe(
              value => this.guideChangeSubject.next(value)
            );
            this.guideSubject.next(guideGroup);
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount());

    this.guideId$.subscribe();
    this.guide$.subscribe();
  }
}

function guideGroupFactory(guide: Guide): FormGroup {
  return new FormGroup({
    id: new FormControl(guide.id),
    username: new FormControl(guide.username),
    firstName: new FormControl(guide.firstName),
    lastName: new FormControl(guide.lastName),
    emailUser: new FormControl(guide.emailUser),
    profile: new FormControl(guide.profile),
    qualifications: new FormControl(guide.qualifications),
    retrainings: new FormControl(guide.retrainings),
    groups: new FormControl(guide.groups),
    userPermissions: new FormControl(guide.userPermissions),
    isStaff: new FormControl(guide.isStaff),
    isActive: new FormControl(guide.isActive),
    phone: new FormControl(guide.phone),
    mobile: new FormControl(guide.mobile),
    portrait: new FormControl(guide.portrait),
    dateJoined: new FormControl(guide.dateJoined),
    memberId: new FormControl(guide.memberId),
    sex: new FormControl(guide.sex),
    birthDate: new FormControl(guide.birthDate),
    note: new FormControl(guide.note),
    memberYear: new FormControl(guide.memberYear),
    integralMember: new FormControl(guide.integralMember),
    memberHome: new FormControl(guide.memberHome)
  });
}
