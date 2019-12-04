import {Observable, Subject} from 'rxjs';
import {map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Injectable} from '@angular/core';
import {SessionService} from '../service/session.service';
import {
  AddSession,
  CloneSession,
  SessionActionTypes,
  SessionNotModified,
  RequestSession,
  SessionCreateComplete,
  DeleteSession,
  SessionDeleteComplete,
  DeactivateSession,
  SessionDeactivateComplete, CreateSession, UpsertSession, SessionUpdateComplete
} from './session.actions';
import {Event} from '../../model/event';
import {AppState} from '../../app.state';
import {AddEvent} from './event.actions';
import {Session} from './session.model';
import {Session as RawSession} from '../../model/session';
import {getEventById} from './event.selectors';


@Injectable({
  providedIn: 'root'
})
export class SessionEffects {
  event$: Observable<Event>;
  private destroySubject = new Subject<void>();

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
            return new SessionCreateComplete();
          } else {
            return new SessionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  deleteSession$: Observable<Action> = this.actions$.pipe(
    ofType<DeleteSession>(SessionActionTypes.DeleteSession),
    map((action: DeleteSession) => action.payload),
    switchMap(payload => {
      return this.sessionService.deleteSession(payload.id).pipe(
        map(session => {
          if (session.id !== 0) {
            return new SessionDeleteComplete();
          } else {
            return new SessionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  deactivateSession$: Observable<Action> = this.actions$.pipe(
    ofType<DeactivateSession>(SessionActionTypes.DeactivateSession),
    map((action: DeactivateSession) => action.payload),
    switchMap(payload => {
      return this.sessionService.deactivateSession(payload.id).pipe(
        map(session => {
          if (session.id !== 0) {
            return new SessionDeactivateComplete();
          } else {
            return new SessionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  createSession$: Observable<Action> = this.actions$.pipe(
    ofType<CreateSession>(SessionActionTypes.CreateSession),
    map((action: CreateSession) => action.payload),
    switchMap(payload => {
      return this.sessionService.createSession(payload.collectiveId, payload.startDate).pipe(
        map(session => {
          if (session.id !== 0) {
            return new SessionCreateComplete();
          } else {
            return new SessionNotModified();
          }
        })
      );
    })
  );

  @Effect()
  safeSession$: Observable<Action> = this.actions$.pipe(
    ofType<UpsertSession>(SessionActionTypes.UpsertSession),
    map((action: UpsertSession) => action.payload),
    switchMap(payload => {
      return this.sessionService.upsertSession(this.transformTourForSaving(payload.session)).pipe(
        map(session => {
          if (session.id !== null) {
            return new SessionUpdateComplete();
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

  transformTourForSaving(sessionInterface: Session): RawSession {
    let session: any = {};

    this.event$ = this.store.select(getEventById(sessionInterface.sessionId)).pipe(
      takeUntil(this.destroySubject),
      tap(event => {
        session = event;
      })
    );
    this.event$.subscribe();

    delete sessionInterface.sessionId;

    this.destroySubject.complete();

    return {
      ... sessionInterface,
      session
    };
  }
}
