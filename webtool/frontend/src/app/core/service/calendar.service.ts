import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {Calendar as RawCalendar} from "../../model/calendar";
import {catchError, first, map, shareReplay} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  etag: string;

  constructor(private http: HttpClient) {}

  getCalendar(): Observable<RawCalendar | null> {
    const headers = {
      Accept: 'application/json',
      'Accept-Language': 'de',
      'Content-Encoding': 'gzip',
      // 'Cache-Control': 'no-cache' /* For Debugging load every time raw-data*/
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<RawCalendar>(
      '/api/frontend/calendars/2/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<RawCalendar> => {
        console.log(error.statusText, error.status);
        return of({id: 0} as RawCalendar);
      }),
      map((response: HttpResponse<RawCalendar>): RawCalendar => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as RawCalendar;
        } else {
          return {id: 0} as RawCalendar;
        }
      }),
      first(),
      shareReplay()
    );
  }
}
