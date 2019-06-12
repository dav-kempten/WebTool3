import {Observable, of} from 'rxjs';
import {catchError, first, map, publishReplay, refCount} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {NameList} from '../../model/name';

@Injectable({
  providedIn: 'root'
})
export class NameService {

  etag: string;

  constructor(private http: HttpClient) { }

  getNameList(): Observable<NameList> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<NameList>(
      '/api/frontend/names/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<NameList> => {
        console.log(error.statusText, error.status);
        return of([] as NameList);
      }),
      map((response: HttpResponse<NameList>): NameList => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as NameList;
        } else {
          return [] as NameList;
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }
}
