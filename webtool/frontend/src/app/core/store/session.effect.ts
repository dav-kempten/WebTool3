import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {SessionService} from '../service/session.service';
import {
  AddSession,
  CloneSession,
  SessionActionTypes,
  SessionNotModified,
  RequestSession
} from './session.actions';
import {Event} from '../../model/event';
import {AppState} from '../../app.state';
import {AddEvent} from './event.actions';
import {Session} from './session.model';
import {Session as RawSession} from '../../model/session';


@Injectable({
  providedIn: 'root'
})
export class SessionEffects {

  constructor(private actions$: Actions, private sessionService: SessionService, private store: Store<AppState>) {}

  @Effect()
  loadSession$: Observable<Action> = this.actions$.pipe(
    ofType<RequestSession>(SessionActionTypes.RequestSession),
    map((action: RequestSession) => action.payload),
    switchMap(payload => {
      return this.sessionService.getSession(payload.id).pipe(
        map(session => {
          if (session.id !== 0) {
            return new AddSession({session: this.transformSession(session)});
          } else {
            return new SessionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  cloneSession$: Observable<Action> = this.actions$.pipe(
    ofType<CloneSession>(SessionActionTypes.CloneSession),
    map((action: CloneSession) => action.payload),
    switchMap(payload => {
      return this.sessionService.cloneSession(payload.id).pipe(
        map(session => {
          if (session.id !== 0) {
            return new AddSession({session: this.transformSession(session)});
          } else {
            return new SessionNotModified();
          }
        })
      );
    })
  );

  transformSession(session: RawSession): Session {
    const sessionId = session.id;

    this.store.dispatch(new AddEvent({event: session.session}));

    delete session.session;

    return {
      ... session,
      sessionId
    };
  }
}
