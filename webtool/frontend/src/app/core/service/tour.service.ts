import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {
  catchError,
  first,
  map,
  publishLast,
  publishReplay,
  refCount,
  shareReplay,
  takeUntil,
  tap
} from 'rxjs/operators';

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Tour, TourSummary} from '../../model/tour';
import {Event} from '../../model/event';

interface TourExt extends Tour {
  category: number;
}


@Injectable({
  providedIn: 'root'
})
export class TourService {

  etag: string;

  constructor(private http: HttpClient) { }

  private destroySubject = new Subject<void>();
  private cloneSubject = new BehaviorSubject<Tour>(undefined);
  private deactivateSubject = new BehaviorSubject<Tour>(undefined);
  private createSubject = new BehaviorSubject<any>(null);
  private updateSubject = new BehaviorSubject<Tour>(null);

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

  cloneTour(tour: Tour): Observable<Tour> {
    this.cloneSubject.next(this.transformTourForCloning(tour));

    return this.http.post<Tour>(
      `/api/frontend/tours/`,
      this.cloneSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Tour> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Tour);
      })
    );
  }

  deleteTour(id: number): Observable<Tour> {
    return this.http.delete<Tour>(
      `/api/frontend/tours/${id}/`,
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Tour> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Tour);
      }),
    );
  }

  deactivateTour(id: number): Observable<Tour> {
    this.getTour(id).pipe(
      takeUntil(this.destroySubject),
      tap(val => {
        val.deprecated = true;
        this.deactivateSubject.next(val);
      }),
      tap(() => console.log(this.deactivateSubject.value)),
    ).subscribe();

    return this.http.put<Tour>(
      `/api/frontend/tours/${id}/`,
      this.deactivateSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Tour> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Tour);
      }),
    );
  }

  createTour(categoryId: number, startdate: string, deadline: string, preliminary: string, guideId: number): Observable<Tour> {
    if (preliminary !== null) {
      this.createSubject.next({category: categoryId, tour: {startDate: startdate} as Event,
        deadline: {startDate: deadline} as Event, preliminary: {startDate: preliminary} as Event,
        guideId, skillId: 1, fitnessId: 1, stateId: 1});
    } else {
      this.createSubject.next({category: categoryId, tour: {startDate: startdate} as Event,
        deadline: {startDate: deadline} as Event, guideId, skillId: 1, fitnessId: 1, stateId: 1});
    }

    return this.http.post<Tour>(
      `/api/frontend/tours/`,
      this.createSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Tour> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Tour);
      }),
    );
  }

  upsertTour(tour: Tour): Observable<Tour> {
    this.updateSubject.next(tour);

    return this.http.put<Tour>(
      `/api/frontend/tours/${this.updateSubject.value.id}/`,
      this.updateSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Tour> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Tour);
      }),
    );
  }

  transformTourForCloning(tour: Tour): any {
    const subsetTour = {...tour};
    delete subsetTour.id;
    delete subsetTour.reference;
    delete subsetTour.tour.id;
    delete subsetTour.deadline.id;
    if (subsetTour.preliminary !== null) {
      delete subsetTour.preliminary.id;
    }
    subsetTour.stateId = 1;
    subsetTour.curQuantity = 0;

    const category = subsetTour.categoryId;
    delete subsetTour.categoryId;

    return {
      ...subsetTour,
      category,
    };
  }
}
