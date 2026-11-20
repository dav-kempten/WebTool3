import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Guide, GuideProfile, GuideSummary } from '../../models/guide';
import { SaveResult, toSaveError } from '../../shared/util/save-error';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

/** Backend GETs carry max-age=86400 — force revalidation (see tour.service.ts). */
const READ_HEADERS = JSON_HEADERS.set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

@Injectable({ providedIn: 'root' })
export class GuideService {
  private http = inject(HttpClient);

  getGuideSummaries(): Observable<GuideSummary[]> {
    return this.http
      .get<GuideSummary[]>('/api/frontend/guides/', { headers: READ_HEADERS })
      .pipe(catchError(() => of([] as GuideSummary[])));
  }

  getGuide(id: number): Observable<Guide | null> {
    if (!id) {
      return of(null);
    }
    return this.http
      .get<Guide>(`/api/frontend/guides/${id}/`, { headers: READ_HEADERS })
      .pipe(catchError(() => of(null)));
  }

  updateGuide(id: number, profile: GuideProfile): Observable<SaveResult<Guide>> {
    return this.http.put<Guide>(`/api/frontend/guides/${id}/`, { profile }).pipe(
      map((data) => ({ data, errors: [] }) as SaveResult<Guide>),
      catchError((error: HttpErrorResponse) => of(toSaveError<Guide>(error))),
    );
  }
}