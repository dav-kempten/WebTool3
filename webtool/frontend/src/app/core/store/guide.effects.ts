import {Observable, Subject} from 'rxjs';
import {map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {GuideService} from '../service/guide.service';
import {AppState} from '../../app.state';
import {AddGuide, GuideActionTypes, GuideNotModified, RequestGuide, UpdateGuide, UpsertGuide} from './guide.actions';
import {Guide as RawGuide} from '../../model/guide';
import {Guide} from './guide.model';


@Injectable({
  providedIn: 'root'
})
export class GuideEffects {
  events$: Observable<Event[]>;

  constructor(private actions$: Actions, private guideService: GuideService, private store: Store<AppState>) {
  }

  @Effect()
  loadGuide$: Observable<Action> = this.actions$.pipe(
    ofType<RequestGuide>(GuideActionTypes.RequestGuide),
    map((action: RequestGuide) => action.payload),
    switchMap(payload => {
      return this.guideService.getGuide(payload.id).pipe(
        map(guide => {
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

    if (guide.profile !== null) {
      profileCity = JSON.parse(guide.profile).city;
      profileJob = JSON.parse(guide.profile).job;
      profileName = JSON.parse(guide.profile).name;
      profileQualification = JSON.parse(guide.profile).qualification;
      profileReason = JSON.parse(guide.profile).reason;
      profileHobby = JSON.parse(guide.profile).hobby;
      profileTip = JSON.parse(guide.profile).tip;
    }

    delete guide.profile;

    return {
      ... guide,
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

    return {
      ... guide,
      profile
    };
  }
}
