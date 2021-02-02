import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Observable, of, Subject} from 'rxjs';
import {Fullcalendar} from '../../model/fullcalendars';
import {catchError, first, map, publishReplay, refCount} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TourCalendarService {

  etag: string;

  constructor(private http: HttpClient) { }

  private destroySubject = new Subject<void>();

  getTourCalendar(): Observable<Fullcalendar[]> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<Fullcalendar[]>(
      '/api/frontend/tourcalendar/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Fullcalendar[]> => {
        console.log(error.statusText, error.status);
        return of([] as Fullcalendar[]);
      }),
      map((response: HttpResponse<Fullcalendar[]>): Fullcalendar[] => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body;
        } else {
          return [] as Fullcalendar[];
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }

}
