import {Observable, of} from 'rxjs';
import {catchError, first, map, publishReplay, refCount} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Name} from '../../model/name';

@Injectable({
  providedIn: 'root'
})
export class NameService {

  etag: string;

  constructor(private http: HttpClient) { }

  getNames(): Observable<Name[]> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<Name[]>(
      '/api/frontend/names/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Name[]> => {
        console.log(error.statusText, error.status);
        return of([] as Name[]);
      }),
      map((response: HttpResponse<Name[]>): Name[] => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body;
        } else {
          return [] as Name[];
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }
}
