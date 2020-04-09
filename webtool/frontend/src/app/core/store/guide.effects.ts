import {Observable, Subject} from 'rxjs';
import {map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {GuideService} from '../service/guide.service';
import {AppState} from '../../app.state';
import {AddGuide, GuideActionTypes, GuideNotModified, RequestGuide, UpdateGuide, UpsertGuide} from './guide.actions';
import {Guide as RawGuide, Profile} from '../../model/guide';
import {Guide} from './guide.model';
import {AddUserQualification, AddUserQualifications} from './userqualification.actions';
import {UserQualification} from '../../model/qualification';
import {Retraining} from '../../model/retraining';
import {AddRetraining} from './retraining.actions';
import {AddProfile} from './profile.actions';
import {getUserQualificationByIds} from './userqualification.selectors';
import {getRetrainingByIds} from './retraining.selectors';
import {getProfileById} from './profile.selectors';


@Injectable({
  providedIn: 'root'
})
export class GuideEffects {
  qualifications$: Observable<UserQualification[]>;
  retrainings$: Observable<Retraining[]>;
  userProfile$: Observable<Profile>;

  private destroySubject = new Subject<void>();

  constructor(private actions$: Actions, private guideService: GuideService, private store: Store<AppState>) {
  }

  @Effect()
  loadGuide$: Observable<Action> = this.actions$.pipe(
    ofType<RequestGuide>(GuideActionTypes.RequestGuide),
    map((action: RequestGuide) => action.payload),
    switchMap(payload => {
      return this.guideService.getGuide(payload.id).pipe(
        map(guide => {
          console.log('guide', guide);
          if (guide.id !== 0) {
            return new AddGuide({guide: this.transformGuide(guide)});
          } else {
            return new GuideNotModified();
          }
        })
      );
    })
  );

  @Effect()
  safeGuide$: Observable<Action> = this.actions$.pipe(
    ofType<UpsertGuide>(GuideActionTypes.UpsertGuide),
    map((action: UpsertGuide) => action.payload),
    switchMap(payload  => {
      return this.guideService.upsertGuide(this.transformGuideForSaving(payload.guide)).pipe(
        map(guide => {
          if (guide.id !== 0) {
            alert('Trainer erfolgreich gespeichert.');
            return new UpdateGuide({guide: {
              id: guide.id,
              changes: {...guide}}});
          } else {
            alert('Trainer speichern gescheitert, nocheinmal versuchen oder Seite neuladen.');
            return new GuideNotModified();
          }
        })
      );
    })
  );

  transformGuide(guide: RawGuide): Guide {
    let profileCity = '';
    let profileJob = '';
    let profileName = '';
    let profileQualification = '';
    let profileReason = '';
    let profileHobby = '';
    let profileTip = '';

    let qualificationIds: number[];
    let retrainingIds: number[];
    const userProfileId = guide.userProfile.id;

    console.log(guide.userProfile);
    this.store.dispatch(new AddProfile({profile: guide.userProfile}));

    if (guide.profile !== null && guide.profile !== '') {
      profileCity = JSON.parse(guide.profile).city;
      profileJob = JSON.parse(guide.profile).job;
      profileName = JSON.parse(guide.profile).name;
      profileQualification = JSON.parse(guide.profile).qualification;
      profileReason = JSON.parse(guide.profile).reason;
      profileHobby = JSON.parse(guide.profile).hobby;
      profileTip = JSON.parse(guide.profile).tip;
    }

    qualificationIds = guide.qualifications.map((userQualification: UserQualification): number => {
      this.store.dispatch(new AddUserQualification({userQualification}));
      return userQualification.id;
    });

    retrainingIds = guide.retrainings.map((retraining: Retraining): number => {
      this.store.dispatch(new AddRetraining({retraining}));
      return retraining.id;
    });


    delete guide.profile;
    delete guide.qualifications;
    delete guide.retrainings;
    delete guide.userProfile;

    return {
      ... guide,
      qualificationIds,
      retrainingIds,
      userProfileId,
      profileCity,
      profileJob,
      profileName,
      profileQualification,
      profileReason,
      profileHobby,
      profileTip
    };
  }

  transformGuideForSaving(guide: Guide): RawGuide {
    const qualifications: UserQualification[] = [];
    const retrainings: Retraining[] = [];
    let userProfile: any = {};

    this.qualifications$ = this.store.select(getUserQualificationByIds(guide.qualificationIds)).pipe(
      takeUntil(this.destroySubject),
      tap(userQualifications => {
        userQualifications.forEach(qualification => qualifications.push(qualification));
      })
    );
    this.qualifications$.subscribe();

    this.retrainings$ = this.store.select(getRetrainingByIds(guide.retrainingIds)).pipe(
      takeUntil(this.destroySubject),
      tap(userRetrainings => {
        userRetrainings.forEach(retraining => retrainings.push(retraining));
      })
    );
    this.retrainings$.subscribe();

    this.userProfile$ = this.store.select(getProfileById(guide.userProfileId)).pipe(
      takeUntil(this.destroySubject),
      tap(profileInstance => userProfile = profileInstance)
    );

    const profile = JSON.stringify({city: guide.profileCity, hobby: guide.profileHobby, job: guide.profileJob,
      name: guide.profileName, qualification: guide.profileQualification, reason: guide.profileReason, tip: guide.profileTip
    });

    delete guide.profileCity;
    delete guide.profileHobby;
    delete guide.profileJob;
    delete guide.profileName;
    delete guide.profileQualification;
    delete guide.profileReason;
    delete guide.profileTip;

    delete guide.qualificationIds;
    delete guide.retrainingIds;
    delete guide.userProfileId;

    return {
      ... guide,
      qualifications,
      retrainings,
      userProfile,
      profile,
    };
  }
}
