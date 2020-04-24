import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError, first, map, publishReplay, refCount} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Guide, GuideSummary} from '../../model/guide';
import {UserQualification} from '../../model/qualification';
import {Retraining} from '../../model/retraining';

@Injectable({
  providedIn: 'root'
})
export class GuideService {

  etag: string;

  constructor(private http: HttpClient) { }

  private updateSubject = new BehaviorSubject<Guide>(null);
  private addQualificationSubject = new BehaviorSubject<Guide>(null);
  private addRetrainingSubject = new BehaviorSubject<Guide>(null);

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

  getGuide(id: number): Observable<Guide> {
    const headers = {
      Accept: 'application/json',
      'Accept-Language': 'de',
      'Content-Encoding': 'gzip',
      // 'Cache-Control': 'no-cache'
    };

    if (!id) {
      return of({id: 0} as Guide);
    }

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<Guide>(
      `/api/frontend/guides/${id}/`,
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Guide> => {
        console.log(error.statusText, error.status);
        return of({id: 0} as Guide);
      }),
      map((response: HttpResponse<Guide>): Guide => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as Guide;
        } else {
          return {id: 0} as Guide;
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }

  upsertGuide(guide: Guide): Observable<Guide> {
    this.updateSubject.next(guide);

    return this.http.put<Guide>(
      `/api/frontend/guides/${this.updateSubject.value.id}/`,
      this.updateSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Guide> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Guide);
      })
    );
  }

  addQualificationGuide(guide: Guide): Observable<Guide> {
    const newUserQualification: UserQualification = {
      id: null, qualification: 'AW', aspirant: false, year: (new Date().getFullYear()), inactive: false, note: '',
      deprecated: false
    };
    guide.qualifications.push(newUserQualification);
    this.addQualificationSubject.next(guide);

    return this.http.put<Guide>(
      `/api/frontend/guides/${this.addQualificationSubject.value.id}/`,
      this.addQualificationSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Guide> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Guide);
      }),
    );
  }

  addRetrainingGuide(guide: Guide): Observable<Guide> {
    const newRetraining: Retraining = {
      id: null, qualification: null, year: (new Date().getFullYear()), specific: false, description: '',
      note: '', deprecated: false
    };
    guide.retrainings.push(newRetraining);
    this.addRetrainingSubject.next(guide);

    return this.http.put<Guide>(
      `/api/frontend/guides/${this.addRetrainingSubject.value.id}/`,
      this.addRetrainingSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Guide> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Guide);
      }),
    );
  }
}
