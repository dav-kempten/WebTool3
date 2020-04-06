import {Injectable} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {ProfileService} from '../service/profile.service';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import {map, switchMap} from 'rxjs/operators';
import {AddProfile, ProfileActionTypes, ProfileNotModified, RequestProfile} from './profile.actions';

@Injectable({
  providedIn: 'root'
})
export class ProfileEffects {

  constructor(private actions$: Actions, private profileService: ProfileService) {}

  loadProfile$: Observable<Action> = this.actions$.pipe(
    ofType<RequestProfile>(ProfileActionTypes.RequestProfile),
    map((action: RequestProfile) => action.payload),
    switchMap(payload => {
      return this.profileService.getProfile(payload.id).pipe(
        map(profileInstance => {
          if (profileInstance.id !== 0) {
            console.log('profileInstance', profileInstance);
            return new AddProfile({profile: profileInstance});
          } else {
            return new ProfileNotModified();
          }
        })
      );
    })
  );
}
