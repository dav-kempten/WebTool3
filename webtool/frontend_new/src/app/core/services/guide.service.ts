import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Guide, GuideSummary } from '../../models/guide';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

@Injectable({ providedIn: 'root' })
export class GuideService {
  private http = inject(HttpClient);

  getGuideSummaries(): Observable<GuideSummary[]> {
    return this.http
      .get<GuideSummary[]>('/api/frontend/guides/', { headers: JSON_HEADERS })
      .pipe(catchError(() => of([] as GuideSummary[])));
  }

  getGuide(id: number): Observable<Guide | null> {
    if (!id) {
      return of(null);
    }
    return this.http
      .get<Guide>(`/api/frontend/guides/${id}/`, { headers: JSON_HEADERS })
      .pipe(catchError(() => of(null)));
  }
}