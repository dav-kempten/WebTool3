import {Observable, of} from 'rxjs';
import {catchError, first, map, shareReplay} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Instruction, Instructions as InstructionSummary} from '../../model/instruction';

type InstructionList = InstructionSummary[];

@Injectable({
  providedIn: 'root'
})
export class InstructionService {

  etag: string;

  constructor(private http: HttpClient) { }

  getInstructionList(): Observable<InstructionList> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<InstructionList>(
      '/api/frontend/instructions/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<InstructionList> => {
        console.log(error.statusText, error.status);
        return of([] as InstructionList);
      }),
      map((response: HttpResponse<InstructionList>): InstructionList => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as InstructionList;
        } else {
          return [] as InstructionList;
        }
      }),
      first(),
      shareReplay()
    );
  }

  getInstruction(url: string): Observable<Instruction> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<Instruction>(
      url,
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<InstructionList> => {
        console.log(error.statusText, error.status);
        return of(null);
      }),
      map((response: HttpResponse<Instruction>): Instruction => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as Instruction;
        } else {
          return null;
        }
      }),
      first(),
      shareReplay()
    );
  }
}
