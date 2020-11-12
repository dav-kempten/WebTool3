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
  SessionDeactivateComplete, CreateSession, UpsertSession, SessionUpdateComplete, UpdateSession
} from './session.actions';
import {Event} from '../../model/event';
import {AppState} from '../../app.state';
import {AddEvent} from './event.actions';
import {Session} from './session.model';
import {Session as RawSession} from '../../model/session';
import {getEventById} from './event.selectors';
import {RequestSessionSummaries} from './session-summary.actions';
import {Router} from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class SessionEffects {
  event$: Observable<Event>;
  private destroySubject = new Subject<void>();

  constructor(private actions$: Actions, private sessionService: SessionService, private store: Store<AppState>, private router: Router) {}

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
            this.router.navigate(['sessions', session.id]);
            return new RequestSessionSummaries();
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
          if (session === null) {
            return new RequestSessionSummaries();
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
            return new RequestSessionSummaries();
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
            this.router.navigate(['sessions', session.id]);
            return new RequestSessionSummaries();
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
      return this.sessionService.upsertSession(this.transformSessionForSaving(payload.session)).pipe(
        map(session => {
          if (session.id !== 0) {
            alert('Gruppentermin erfolgreich gespreichert.');
            const sessionInterface = this.transformSession(session);
            this.store.dispatch(new RequestSessionSummaries());
            return new UpdateSession({session: {
              id: sessionInterface.id,
              changes: {...sessionInterface}}});
          } else {
            alert('Gruppentermin speichern gescheitert, nocheinmal versuchen oder Seite neuladen.');
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

  transformSessionForSaving(sessionInterface: Session): RawSession {
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

    /* Check contradictory distance/distal fields before saving */
    if (!session.distal) { session.distance = 0; }

    return {
      ... sessionInterface,
      session
    };
  }
}
