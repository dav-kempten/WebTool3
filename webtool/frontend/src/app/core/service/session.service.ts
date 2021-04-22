import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {
  catchError,
  first,
  map,
  publishReplay,
  refCount,
  takeUntil,
  tap
} from 'rxjs/operators';

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Session, SessionSummary} from '../../model/session';
import {Event} from '../../model/event';


@Injectable({
  providedIn: 'root'
})
export class SessionService {

  etag: string;

  constructor(private http: HttpClient) { }

  private destroySubject = new Subject<void>();
  private cloneSubject = new BehaviorSubject<Session>(undefined);
  private deactivateSubject = new BehaviorSubject<Session>(undefined);
  private createSubject = new BehaviorSubject<Session>(null);
  private updateSubject = new BehaviorSubject<Session>(null);

  getSessionSummaries(): Observable<SessionSummary[]> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<SessionSummary[]>(
      '/api/frontend/sessions/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<SessionSummary[]> => {
        console.log(error.statusText, error.status);
        return of([] as SessionSummary[]);
      }),
      map((response: HttpResponse<SessionSummary[]>): SessionSummary[] => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body;
        } else {
          return [] as SessionSummary[];
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }

  getSession(id: number): Observable<Session> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (!id) {
      return of ({id: 0} as Session);
    }

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<Session>(
      `/api/frontend/sessions/${id}/`,
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Session> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Session);
      }),
      map((response: HttpResponse<Session>): Session => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as Session;
        } else {
          return {id: 0} as Session;
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }

  cloneSession(session: Session): Observable<Session> {
    this.cloneSubject.next(this.transformSessionForCloning(session));

    return this.http.post<Session>(
      `/api/frontend/sessions/`,
      this.cloneSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Session> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Session);
      }),
    );
  }

  deleteSession(id: number): Observable<Session> {
    return this.http.delete<Session>(
      `/api/frontend/sessions/${id}/`,
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Session> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Session);
      }),
    );
  }

  deactivateSession(id: number): Observable<Session> {
    this.getSession(id).pipe(
      takeUntil(this.destroySubject),
      tap(val => {
        val.deprecated = true;
        this.deactivateSubject.next(val);
      })
    ).subscribe();

    return this.http.put<Session>(
      `/api/frontend/sessions/${id}/`,
      this.deactivateSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Session> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Session);
      }),
    );
  }

  createSession(collective: number, date: string): Observable<Session> {
    this.createSubject.next({collectiveId: collective, session: {startDate: date} as Event} as Session);

    return this.http.post<Session>(
      `/api/frontend/sessions/`,
      this.createSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Session> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Session);
      }),
    );
  }

  upsertSession(session: Session): Observable<Session> {
    this.updateSubject.next(session);

    return this.http.put<Session>(
      `/api/frontend/sessions/${this.updateSubject.value.id}/`,
      this.updateSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Session> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Session);
      }),
    );
  }

  transformSessionForCloning(session: Session): any {
    const subsetSession = {...session};
    delete subsetSession.id;
    delete subsetSession.reference;
    delete subsetSession.session.id;
    subsetSession.stateId = 1;
    return subsetSession;
  }
}
