import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { RequirementOverview } from '../../models/requirement';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

/**
 * A live view — the backend already answers "Cache-Control: no-store", and the
 * request headers keep an intermediate proxy from serving a stale count.
 */
const READ_HEADERS = JSON_HEADERS.set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

@Injectable({ providedIn: 'root' })
export class RequirementService {
  private http = inject(HttpClient);

  getOverview(): Observable<RequirementOverview | null> {
    return this.http
      .get<RequirementOverview>('/api/frontend/requirements/', { headers: READ_HEADERS })
      .pipe(catchError(() => of(null)));
  }
}
