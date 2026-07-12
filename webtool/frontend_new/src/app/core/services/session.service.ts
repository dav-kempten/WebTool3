import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Session, SessionSummary, RawSession } from '../../models/session';
import { Event } from '../../models/event';

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

  upsertSession(id: number, body: unknown): Observable<RawSession | null> {
    return this.http
      .put<RawSession>(`/api/frontend/sessions/${id}/`, body)
      .pipe(catchError(() => of(null)));
  }

  deleteSession(id: number): Observable<boolean> {
    return this.http.delete(`/api/frontend/sessions/${id}/`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}