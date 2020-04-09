import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
import {Profile} from '../../model/guide';
import {filter, flatMap, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getGuideById} from '../../core/store/guide.selectors';
import {RequestGuide, UpdateGuide, UpsertGuide} from '../../core/store/guide.actions';
import {LocaleSettings} from 'primeng/calendar';
import {AuthService, User} from '../../core/service/auth.service';
import {Guide} from '../../core/store/guide.model';
import {Qualification, UserQualification} from '../../model/qualification';
import {Retraining} from '../../model/retraining';
import {getProfileById} from '../../core/store/profile.selectors';
import {UpdateProfile} from '../../core/store/profile.actions';
import {getUserQualificationByIds} from '../../core/store/userqualification.selectors';
import {getRetrainingByIds} from '../../core/store/retraining.selectors';
import {UpdateUserQualification} from '../../core/store/userqualification.actions';
import {UpdateRetraining} from '../../core/store/retraining.actions';

const german: LocaleSettings = {
  firstDayOfWeek: 1,
  dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  monthNamesShort: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  today: 'Heute',
  clear: 'Löschen',
  dateFormat: 'dd.mm.yy'
};

@Component({
  selector: 'avk-guide-detail',
  templateUrl: './guide-detail.component.html',
  styleUrls: ['./guide-detail.component.css'],
})
export class GuideDetailComponent implements OnInit, OnDestroy {

  private destroySubject = new Subject<void>();
  private guideSubject = new BehaviorSubject<FormGroup>(undefined);
  private guideChangeSubject = new BehaviorSubject<Guide>(undefined);
  private profileSubject = new BehaviorSubject<FormGroup>(undefined);
  private profileChangeSubject = new BehaviorSubject<Profile>(undefined);
  private qualificationsSubject = new BehaviorSubject<FormArray>(undefined);
  private qualificationChangeSubject = new BehaviorSubject<UserQualification>(undefined);
  private retrainingsSubject = new BehaviorSubject<FormArray>(undefined);
  private retrainingChangeSubject = new BehaviorSubject<Retraining>(undefined);

  guideGroup$: Observable<FormGroup> = this.guideSubject.asObservable();
  profileGroup$: Observable<FormGroup> = this.profileSubject.asObservable();
  userQualificationGroup$: Observable<FormArray> = this.qualificationsSubject.asObservable();
  retrainingGroup$: Observable<FormArray> = this.retrainingsSubject.asObservable();
  guideChange$: Observable<Guide> = this.guideChangeSubject.asObservable();
  profileChange$: Observable<Profile> = this.profileChangeSubject.asObservable();
  qualificationChange$: Observable<UserQualification> = this.qualificationChangeSubject.asObservable();
  retrainingChange$: Observable<Retraining> = this.retrainingChangeSubject.asObservable();

  guideId$: Observable<number>;
  guide$: Observable<Guide>;
  profileId$: Observable<number>;
  profile$: Observable<Profile>;
  qualificationIds$: Observable<number[]>;
  qualifications$: Observable<UserQualification[]>;
  retrainingIds$: Observable<number[]>;
  retrainings$: Observable<Retraining[]>;

  authState$: Observable<User>;
  loginObject = {id: undefined, firstName: '', lastName: '', role: undefined, valState: 0};

  userProfileNumber: number;
  qualificationNumbers: number[];
  retrainingNumbers: number[];

  de = german;

  constructor(private store: Store<AppState>, private userService: AuthService) {}

  ngOnInit(): void {

    this.authState$ = this.userService.user$;
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
      refCount()
    );

    this.profileId$ = this.guide$.pipe(
      takeUntil(this.destroySubject),
      filter(guide => !!guide),
      map(guide => guide.userProfileId),
      tap(guide => this.userProfileNumber = guide),
      publishReplay(1),
      refCount()
    );

    this.profile$ = this.profileId$.pipe(
      takeUntil(this.destroySubject),
      filter(userprofileId => !!userprofileId),
      flatMap(userprofileId => this.store.select(getProfileById(userprofileId)).pipe(
        tap(profile => {
          console.log(profile);
          this.profileSubject.next(profileGroupFactory(profile));
        })
      )),
      // shareReplay(),
      publishReplay(1),
      refCount()
    );

    this.qualificationIds$ = this.guide$.pipe(
      takeUntil(this.destroySubject),
      filter(guide => !!guide),
      map(guide => [...guide.qualificationIds]),
      tap(guide => this.qualificationNumbers = guide),
      publishReplay(1),
      refCount()
    );

    this.qualifications$ = this.qualificationIds$.pipe(
      takeUntil(this.destroySubject),
      filter(qualificationIds => !!qualificationIds),
      flatMap(qualificationsIds => this.store.select(getUserQualificationByIds(qualificationsIds)).pipe(
        filter(() => !!qualificationsIds && qualificationsIds.length > 0),
        tap(qualifications => {
          const qualificationArray = new FormArray([]);
          qualifications.forEach((qualification: UserQualification) => {
            const qualificationGroup = userQualficationGroupFactory(qualification);
            qualificationGroup.valueChanges.pipe(
              takeUntil(this.destroySubject)
            ).subscribe(value => this.qualificationChangeSubject.next(value));
            qualificationArray.push(qualificationGroup);
          });
          this.qualificationsSubject.next(qualificationArray);
        })
      )),
      publishReplay(1),
      refCount()
    );

    this.retrainingIds$ = this.guide$.pipe(
      takeUntil(this.destroySubject),
      filter(guide => !!guide),
      map(guide => [...guide.retrainingIds]),
      tap(guide => this.retrainingNumbers = guide),
      publishReplay(1),
      refCount()
    );

    this.retrainings$ = this.retrainingIds$.pipe(
      takeUntil(this.destroySubject),
      filter(retrainingIds => !!retrainingIds),
      flatMap(retrainingsIds => this.store.select(getRetrainingByIds(retrainingsIds)).pipe(
        filter(() => !!retrainingsIds && retrainingsIds.length > 0),
        tap(retrainings => {
          const retrainingArray = new FormArray([]);
          retrainings.forEach((retraining: Retraining) => {
            const retrainingGroup = retrainingGroupFactory(retraining);
            retrainingGroup.valueChanges.pipe(
              takeUntil(this.destroySubject)
            ).subscribe(value => this.retrainingChangeSubject.next(value));
            retrainingArray.push(retrainingGroup);
          });
          this.retrainingsSubject.next(retrainingArray);
        })
      )),
      publishReplay(1),
      refCount()
    );

    this.guideId$.subscribe();
    this.guide$.subscribe();
    this.profile$.subscribe();
    this.qualificationIds$.subscribe();
    this.qualifications$.subscribe();
    this.retrainingIds$.subscribe();
    this.retrainings$.subscribe();

    this.qualificationChange$.pipe(
      takeUntil(this.destroySubject),
      filter(qualification => !!qualification),
      publishReplay(1),
      refCount()
    ).subscribe(
      qualification => this.store.dispatch(
        new UpdateUserQualification({userQualification: {id: qualification.id, changes: {...qualification}}})
      )
    );

    this.retrainingChange$.pipe(
      takeUntil(this.destroySubject),
      filter(retraining => !!retraining),
      publishReplay(1),
      refCount()
    ).subscribe(
      retraining => this.store.dispatch(
        new UpdateRetraining({retraining: {id: retraining.id, changes: {...retraining}}})
      )
    );

    this.guideChange$.pipe(
      takeUntil(this.destroySubject),
      filter(guide => !!guide),
      publishReplay(1),
      refCount()
    ).subscribe(
      guide => this.store.dispatch(
        new UpdateGuide({guide: {id: guide.id, changes: {...guide}}})
      )
    );

    this.profileChange$.pipe(
      takeUntil(this.destroySubject),
      filter(profile => !!profile),
      publishReplay(1),
      refCount()
    ).subscribe(
      profile => this.store.dispatch(
        new UpdateProfile({profile: {id: profile.id, changes: {...profile}}})
      )
    );
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.guideSubject.complete();
  }

  save(guide) {
    this.store.dispatch(new UpsertGuide({guide: guide as Guide}));
  }
}

function guideGroupFactory(guide: Guide): FormGroup {
  return new FormGroup({
    id: new FormControl(guide.id),
    profileCity: new FormControl(guide.profileCity),
    profileJob: new FormControl(guide.profileJob),
    profileName: new FormControl(guide.profileName),
    profileQualification: new FormControl(guide.profileQualification),
    profileReason: new FormControl(guide.profileReason),
    profileHobby: new FormControl(guide.profileHobby),
    profileTip: new FormControl(guide.profileTip),
    qualifications: new FormControl(guide.qualificationIds),
    retrainings: new FormControl(guide.retrainingIds),
    phone: new FormControl(guide.phone),
    mobile: new FormControl(guide.mobile),
    email: new FormControl(guide.email),
    userProfile: new FormControl(guide.userProfileId),
  });
}

function profileGroupFactory(profile: Profile): FormGroup {
  return new FormGroup({
    id: new FormControl(profile.id),
    memberId: new FormControl(profile.memberId),
    sex: new FormControl(profile.sex),
    birthDate: new FormControl(profile.birthDate),
    note: new FormControl(profile.note),
    memberYear: new FormControl(profile.memberYear),
    integralMember: new FormControl(profile.integralMember),
    memberHome: new FormControl(profile.memberHome),
    portrait: new FormControl(profile.portrait),
  });
}

function userQualficationGroupFactory(userQualification: UserQualification): FormGroup {
  return new FormGroup({
    id: new FormControl(userQualification.id),
    qualification: qualificationGroupFactory(userQualification.qualification),
    aspirant: new FormControl(userQualification.aspirant),
    year: new FormControl(userQualification.year),
    note: new FormControl(userQualification.note),
  });
}

function qualificationGroupFactory(qualification: Qualification): FormGroup {
  return new FormGroup({
    id: new FormControl(qualification.id),
    code: new FormControl(qualification.code),
    name: new FormControl(qualification.name),
    group: new FormControl(qualification.group),
  });
}

function retrainingGroupFactory(retraining: Retraining): FormGroup {
  return new FormGroup({
    id: new FormControl(retraining.id),
    qualification: new FormControl(retraining.qualification),
    year: new FormControl(retraining.year),
    specific: new FormControl(retraining.specific),
    description: new FormControl(retraining.description),
    note: new FormControl(retraining.note),
  });
}
