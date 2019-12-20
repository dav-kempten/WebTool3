import {Observable, of} from 'rxjs';
import {catchError, first, map, publishReplay, refCount} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Guide, GuideSummary} from '../../model/guide';

@Injectable({
  providedIn: 'root'
})
export class GuideService {

  etag: string;

  constructor(private http: HttpClient) { }

  getGuideSummaries(): Observable<GuideSummary[]> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<GuideSummary[]>(
      '/api/frontend/guides/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<GuideSummary[]> => {
        console.log(error.statusText, error.status);
        return of([] as GuideSummary[]);
      }),
      map((response: HttpResponse<GuideSummary[]>): GuideSummary[] => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body;
        } else {
          return [] as GuideSummary[];
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }
}
