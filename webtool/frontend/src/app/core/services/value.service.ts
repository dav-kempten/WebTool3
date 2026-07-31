import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Values } from '../../models/value';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

/**
 * The endpoint answers with "Cache-Control: public, max-age=86400", so without
 * this the browser serves a day-old bundle from cache and never asks the
 * server — reference data changed on the backend would not surface until the
 * cache expired. Force revalidation (see tour.service.ts).
 */
const READ_HEADERS = JSON_HEADERS.set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

@Injectable({ providedIn: 'root' })
export class ValueService {
  private http = inject(HttpClient);

  getValues(): Observable<Values | null> {
    return this.http
      .get<Values>('/api/frontend/values/', { headers: READ_HEADERS })
      .pipe(catchError(() => of(null)));
  }
}
