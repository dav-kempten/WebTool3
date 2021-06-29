import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState, selectRouterDetailId} from '../../app.state';
import {AuthService} from '../../core/service/auth.service';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Permission} from '../../core/service/permission.service';
import {FormControl, FormGroup} from '@angular/forms';
import {flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getGuideById} from '../../core/store/guide.selectors';
import {RequestGuide} from '../../core/store/guide.actions';
import {Guide, Profile} from '../../model/guide';

@Component({
  selector: 'avk-guide-detail',
  templateUrl: './guide-detail.component.html',
  styleUrls: ['./guide-detail.component.css']
})
export class GuideDetailComponent implements OnInit, OnDestroy {
  private destroySubject: Subject<boolean> = new Subject<boolean>();

  permissionHandler$: Observable<boolean>;
  permissionCurrent$: Observable<Permission>;

  guideId$: Observable<number>;
  guide$: Observable<Guide>;
  private profileSubject = new BehaviorSubject<FormGroup>(undefined);
  private profileChangeSubject = new BehaviorSubject<Profile>(undefined);

  profileGroup$: Observable<FormGroup> = this.profileSubject.asObservable();

  id = new FormControl(undefined);
  username = new FormControl('');
  lastName = new FormControl('');
  firstName = new FormControl('');
  profile = new FormControl('');

  guide: FormGroup = new FormGroup({
    id: this.id,
    username: this.username,
    lastName: this.lastName,
    firstName: this.firstName,
    profile: this.profile
  });

  city = new FormControl('');
  name = new FormControl('');
  qualification = new FormControl('');
  job = new FormControl('');
  reason = new FormControl('');
  hobby = new FormControl('');
  tip = new FormControl('');

  guideNotes: FormGroup = new FormGroup({
    city: this.city,
    name : this.name,
    qualification: this.qualification,
    job: this.job,
    reason: this.reason,
    hobby: this.hobby,
    tip: this.tip
  });

  constructor(private store: Store<AppState>, private authService: AuthService) { }

  ngOnInit() {
    this.permissionCurrent$ = this.authService.guidePermission$;

    this.guideId$ = this.store.select(selectRouterDetailId);

    this.guide$ = this.guideId$.pipe(
      takeUntil(this.destroySubject),
      flatMap(id => this.store.pipe(
        takeUntil(this.destroySubject),
        select(getGuideById(id)),
        tap(guide => {
          if (!guide) {
            this.store.dispatch(new RequestGuide({id}));
          } else {
            /* Generate profile */
            const profileGroup = profileGroupFactory(guide.profile);
            profileGroup.valueChanges.pipe(takeUntil(this.destroySubject)).subscribe(
              value => this.profileChangeSubject.next(value)
            );
            this.profileSubject.next(profileGroup);
          }
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.guide$.subscribe();
  }

  ngOnDestroy(): void {
    this.destroySubject.next(true);
    this.destroySubject.unsubscribe();

    this.profileSubject.complete();
  }
}

function guideGroupFactory(guide: Guide): FormGroup {
  return new FormGroup({
    id: new FormControl(guide.id),
    username: new FormControl(guide.username),
    lastName: new FormControl(guide.lastName),
    fristName: new FormControl(guide.firstName),
    profile: new FormControl(guide.profile)
  });
}

function profileGroupFactory(profile: string): FormGroup {
  const parseObj = JSON.parse(profile);
  return new FormGroup({
    city: new FormControl(parseObj.city),
    name: new FormControl(parseObj.username),
    qualification: new FormControl(parseObj.lastName),
    job: new FormControl(parseObj.job),
    reason: new FormControl(parseObj.firstName),
    hobby: new FormControl(parseObj.profile),
    tip: new FormControl(parseObj.profile)
  });
}
