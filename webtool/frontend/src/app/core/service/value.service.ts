import {Observable, of} from 'rxjs';
import {catchError, first, map, shareReplay} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Values as RawValues} from '../../model/value';

@Injectable({
  providedIn: 'root'
})
export class ValueService {

  etag: string;

  constructor(private http: HttpClient) {}

  getValues(): Observable<RawValues | null> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<RawValues>(
      '/api/frontend/values/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<RawValues> => {
        console.log(error.statusText, error.status);
        return of({states: []} as RawValues);
      }),
      map((response: HttpResponse<RawValues>): RawValues => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as RawValues;
        } else {
          return {states: []} as RawValues;
        }
      }),
      first(),
      shareReplay()
    );
  }
}
