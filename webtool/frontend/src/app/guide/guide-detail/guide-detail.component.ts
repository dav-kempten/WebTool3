import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {FormControl, FormGroup} from '@angular/forms';
import {AppState, selectRouterDetailId} from '../../app.state';
import {Guide} from '../../model/guide';
import {flatMap, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';
import {getGuideById} from '../../core/store/guide.selectors';
import {RequestGuide} from '../../core/store/guide.actions';
import {LocaleSettings} from 'primeng/calendar';
import {AuthService, User} from '../../core/service/auth.service';

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

  guideGroup$: Observable<FormGroup> = this.guideSubject.asObservable();

  guideId$: Observable<number>;
  guide$: Observable<Guide>;

  authState$: Observable<User>;
  loginObject = {id: undefined, firstName: '', lastName: '', role: undefined, valState: 0};

  de = german;

  constructor(private store: Store<AppState>, private userService: AuthService) {
    // this.store.dispatch(new GuidesRequested());
  }

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
      refCount());

    this.guideId$.subscribe();
    this.guide$.subscribe();
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
    this.guideSubject.complete();
  }
}

function guideGroupFactory(guide: Guide): FormGroup {
  return new FormGroup({
    id: new FormControl(guide.id),
    username: new FormControl(guide.user.username),
    firstName: new FormControl(guide.user.firstName),
    lastName: new FormControl(guide.user.lastName),
    emailUser: new FormControl(guide.user.email),
    profileCity: new FormControl(parseProfile(guide.profile, 'city')),
    profileJob: new FormControl(parseProfile(guide.profile, 'job')),
    profileName: new FormControl(parseProfile(guide.profile, 'name')),
    profileQualification: new FormControl(parseProfile(guide.profile, 'qualification')),
    profileReason: new FormControl(parseProfile(guide.profile, 'reason')),
    profileHobby: new FormControl(parseProfile(guide.profile, 'hobby')),
    profileTip: new FormControl(parseProfile(guide.profile, 'tip')),
    qualifications: new FormControl(guide.qualifications),
    retrainings: new FormControl(guide.retrainings),
    groups: new FormControl(guide.user.groups),
    userPermissions: new FormControl(guide.user.permissions),
    isStaff: new FormControl(guide.user.isStaff),
    isActive: new FormControl(guide.user.isActive),
    phone: new FormControl(guide.phone),
    mobile: new FormControl(guide.mobile),
    portrait: new FormControl(guide.user.profile.portrait),
    dateJoined: new FormControl(guide.user.dateJoined.substring(0, 10)),
    memberId: new FormControl(guide.user.profile.memberId),
    sex: new FormControl(guide.user.profile.sex),
    birthDate: new FormControl(guide.user.profile.birthDate),
    note: new FormControl(guide.user.profile.note),
    memberYear: new FormControl(guide.user.profile.memberYear),
    integralMember: new FormControl(guide.user.profile.integralMember),
    memberHome: new FormControl(guide.user.profile.memberHome)
  });
}

function parseProfile(profile: string, identifierString: string) {
  let profileVal: string = null;
  if (profile !== null && profile !== '') {
    switch (identifierString) {
      case 'city':
        profileVal = JSON.parse(profile).city;
        break;
      case 'job':
        profileVal = JSON.parse(profile).job;
        break;
      case 'name':
        profileVal = JSON.parse(profile).name;
        break;
      case 'qualification':
        profileVal = JSON.parse(profile).qualification;
        break;
      case 'reason':
        profileVal = JSON.parse(profile).reason;
        break;
      case 'hobby':
        profileVal = JSON.parse(profile).hobby;
        break;
      case 'tip':
        profileVal = JSON.parse(profile).tip;
        break;
    }
  }
  return profileVal;
}


