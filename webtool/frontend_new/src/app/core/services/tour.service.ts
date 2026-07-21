import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { RawTour, Tour, TourSummary } from '../../models/tour';
import { Event } from '../../models/event';
import { SaveResult, toSaveError } from '../../shared/util/save-error';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

/**
 * The backend list/detail responses carry "Cache-Control: public, max-age=86400",
 * so the browser would happily serve day-old data to reloads after a save.
 * Force revalidation on every GET.
 */
const READ_HEADERS = JSON_HEADERS.set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

export interface CreateTourPayload {
  categoryId: number;
  startDate: string;
  deadline: string;
  preliminary: string | null;
  guideId: number | null;
}

@Injectable({ providedIn: 'root' })
export class TourService {
  private http = inject(HttpClient);

  getTourSummaries(): Observable<TourSummary[]> {
    return this.http
      .get<TourSummary[]>('/api/frontend/tours/', { headers: READ_HEADERS })
      .pipe(catchError(() => of([] as TourSummary[])));
  }

  /** Returns the nested wire shape (sub-events + decimal strings). */
  getTour(id: number): Observable<RawTour | null> {
    if (!id) {
      return of(null);
    }
    return this.http
      .get<RawTour>(`/api/frontend/tours/${id}/`, { headers: READ_HEADERS })
      .pipe(catchError(() => of(null)));
  }

  createTour(payload: CreateTourPayload): Observable<Tour> {
    const body: Record<string, unknown> = {
      category: payload.categoryId,
      tour: { startDate: payload.startDate } as Event,
      deadline: { startDate: payload.deadline } as Event,
      guideId: payload.guideId,
      skillId: 1,
      fitnessId: 1,
      stateId: 1,
    };
    if (payload.preliminary !== null) {
      body['preliminary'] = { startDate: payload.preliminary } as Event;
    }
    return this.http
      .post<Tour>('/api/frontend/tours/', body)
      .pipe(catchError(() => of({ id: 0 } as Tour)));
  }

  /** `body` is a fully assembled RawTour stripped of ids + carrying `category`. */
  cloneTour(body: unknown): Observable<Tour> {
    return this.http
      .post<Tour>('/api/frontend/tours/', body)
      .pipe(catchError(() => of({ id: 0 } as Tour)));
  }

  /** `body` is a fully assembled RawTour (nested events, decimal strings). */
  upsertTour(id: number, body: unknown): Observable<SaveResult<RawTour>> {
    return this.http.put<RawTour>(`/api/frontend/tours/${id}/`, body).pipe(
      map((data) => ({ data, errors: [] }) as SaveResult<RawTour>),
      catchError((error: HttpErrorResponse) => of(toSaveError<RawTour>(error))),
    );
  }

  deleteTour(id: number): Observable<boolean> {
    return this.http.delete(`/api/frontend/tours/${id}/`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}
