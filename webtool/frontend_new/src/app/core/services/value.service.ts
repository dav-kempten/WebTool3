import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Values } from '../../models/value';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

@Injectable({ providedIn: 'root' })
export class ValueService {
  private http = inject(HttpClient);

  getValues(): Observable<Values | null> {
    return this.http
      .get<Values>('/api/frontend/values/', { headers: JSON_HEADERS })
      .pipe(catchError(() => of(null)));
  }
}
