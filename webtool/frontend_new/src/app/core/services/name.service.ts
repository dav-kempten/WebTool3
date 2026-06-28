import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Name } from '../../models/name';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

@Injectable({ providedIn: 'root' })
export class NameService {
  private http = inject(HttpClient);

  getNames(): Observable<Name[]> {
    return this.http
      .get<Name[]>('/api/frontend/names/', { headers: JSON_HEADERS })
      .pipe(catchError(() => of([] as Name[])));
  }
}
