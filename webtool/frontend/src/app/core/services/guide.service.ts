import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Guide, GuideSummary } from '../../models/guide';

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
}