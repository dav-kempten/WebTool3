import {Observable, of} from 'rxjs';
import {catchError, first, map, publishLast, publishReplay, refCount, shareReplay} from 'rxjs/operators';

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Tour, TourSummary} from '../../model/tour';

@Injectable({
  providedIn: 'root'
})
export class TourService {

  etag: string;

  constructor(private http: HttpClient) { }

  getTourSummaries(): Observable<TourSummary[]> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<TourSummary[]>(
      '/api/frontend/tours/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<TourSummary[]> => {
        console.log(error.statusText, error.status);
        return of([] as TourSummary[]);
      }),
      map((response: HttpResponse<TourSummary[]>): TourSummary[] => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body;
        } else {
          return [] as TourSummary[];
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }

  getTour(id: number): Observable<Tour> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (!id) {
      return of ({id: 0} as Tour);
    }

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<Tour>(
      `/api/frontend/tours/${id}/`,
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Tour> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Tour);
      }),
      map((response: HttpResponse<Tour>): Tour => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as Tour;
        } else {
          return {id: 0} as Tour;
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }

  cloneTour(id: number): Observable<Tour> {
    console.log('Clone Tour', id);
    return of({id : 0} as Tour);
  }
}
