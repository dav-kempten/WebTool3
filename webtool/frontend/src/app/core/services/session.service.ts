import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Session, SessionSummary, RawSession } from '../../models/session';
import { Event } from '../../models/event';
import { ActivityPreview } from '../../models/preview';
import { SaveResult, toSaveError } from '../../shared/util/save-error';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

/** Backend GETs carry max-age=86400 — force revalidation (see tour.service.ts). */
const READ_HEADERS = JSON_HEADERS.set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

export interface CreateSessionPayload {
  collectiveId: number;
  startDate: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);

  getSessionSummaries(): Observable<SessionSummary[]> {
    return this.http
      .get<SessionSummary[]>('/api/frontend/sessions/', { headers: READ_HEADERS })
      .pipe(catchError(() => of([] as SessionSummary[])));
  }

  getSession(id: number): Observable<RawSession | null> {
    if (!id) {
      return of(null);
    }
    return this.http
      .get<RawSession>(`/api/frontend/sessions/${id}/`, { headers: READ_HEADERS })
      .pipe(catchError(() => of(null)));
  }

  /** The group date as the homepage receives it, also before it is published. */
  getPreview(id: number): Observable<ActivityPreview | null> {
    return this.http
      .get<ActivityPreview>(`/api/frontend/sessions/${id}/preview/`, { headers: READ_HEADERS })
      .pipe(catchError(() => of(null)));
  }

  createSession(payload: CreateSessionPayload): Observable<Session> {
    const body = {
      collectiveId: payload.collectiveId,
      session: { startDate: payload.startDate } as Event,
    };
    return this.http
      .post<Session>('/api/frontend/sessions/', body)
      .pipe(catchError(() => of({ id: 0 } as Session)));
  }

  cloneSession(body: unknown): Observable<Session> {
    return this.http
      .post<Session>('/api/frontend/sessions/', body)
      .pipe(catchError(() => of({ id: 0 } as Session)));
  }

  upsertSession(id: number, body: unknown): Observable<SaveResult<RawSession>> {
    return this.http.put<RawSession>(`/api/frontend/sessions/${id}/`, body).pipe(
      map((data) => ({ data, errors: [] }) as SaveResult<RawSession>),
      catchError((error: HttpErrorResponse) => of(toSaveError<RawSession>(error))),
    );
  }

  /** Fertig → In Arbeit; only the state changes (see views/frontend/locks.py). */
  reopenSession(id: number): Observable<SaveResult<RawSession>> {
    return this.http.post<RawSession>(`/api/frontend/sessions/${id}/reopen/`, {}).pipe(
      map((data) => ({ data, errors: [] }) as SaveResult<RawSession>),
      catchError((error: HttpErrorResponse) => of(toSaveError<RawSession>(error))),
    );
  }

  deleteSession(id: number): Observable<boolean> {
    return this.http.delete(`/api/frontend/sessions/${id}/`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}