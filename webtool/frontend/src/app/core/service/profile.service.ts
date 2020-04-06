import {Observable, of} from 'rxjs';
import {catchError, first, map, publishReplay, refCount} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Profile} from '../../model/guide';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  etag: string;

  constructor(private http: HttpClient) { }

  getProfile(id: number): Observable<Profile> {
    const headers = {
      Accept: 'application/json',
      'Accept-Language': 'de',
      'Content-Encoding': 'gzip',
      // 'Cache-Control': 'no-cache'
    };

    if (!id) {
      return of({id: 0} as Profile);
    }

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<Profile>(
      `/api/frontend/profiles/${id}/`,
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Profile> => {
        console.log(error.statusText, error.status);
        return of({id: 0} as Profile);
      }),
      map((response: HttpResponse<Profile>): Profile => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as Profile;
        } else {
          return {id: 0} as Profile;
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }
}
