import {BehaviorSubject, Observable, of, pipe, Subject} from 'rxjs';
import {
  catchError,
  first,
  map,
  publishReplay,
  refCount,
  takeUntil,
  tap
} from 'rxjs/operators';

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Instruction, InstructionSummary} from '../../model/instruction';
import {Event} from '../../model/event';

@Injectable({
  providedIn: 'root'
})
export class InstructionService {

  etag: string;

  constructor(private http: HttpClient) { }

  private destroySubject = new Subject<void>();
  private cloneSubject = new BehaviorSubject<Instruction>(undefined);
  private deactivateSubject = new BehaviorSubject<Instruction>(undefined);
  private createSubject = new BehaviorSubject<Instruction>(null);

  getInstructionSummaries(): Observable<InstructionSummary[]> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<InstructionSummary[]>(
      '/api/frontend/instructions/',
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<InstructionSummary[]> => {
        console.log(error.statusText, error.status);
        return of([] as InstructionSummary[]);
      }),
      map((response: HttpResponse<InstructionSummary[]>): InstructionSummary[] => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body;
        } else {
          return [] as InstructionSummary[];
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }

  getInstruction(id: number): Observable<Instruction> {
    const headers = {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'Content-Encoding': 'gzip',
        // 'Cache-Control': 'no-cache'
    };

    if (!id) {
      return of ({id: 0} as Instruction);
    }

    if (this.etag) {
      headers['If-None-Match'] = this.etag;
    }

    return this.http.get<Instruction>(
      `/api/frontend/instructions/${id}/`,
      {headers: new HttpHeaders(headers), observe: 'response'}
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Instruction> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Instruction);
      }),
      map((response: HttpResponse<Instruction>): Instruction => {
        const responseHeaders = response.headers;
        if (responseHeaders) {
          if (responseHeaders.keys().indexOf('etag') > -1) {
            this.etag = responseHeaders.get('etag').replace(/(W\/)?(".+")/g, '$2');
          }
          return response.body as Instruction;
        } else {
          return {id: 0} as Instruction;
        }
      }),
      first(),
      publishReplay(1),
      refCount()
    );
  }

  cloneInstruction(id: number): Observable<Instruction> {
    /* TODO: zu langsam --> Bug beim ersten Mal ausführen, die Befehle überholen sich */
    this.getInstruction(id).pipe(
      takeUntil(this.destroySubject),
      tap(val => this.cloneSubject.next(this.tranformInstructionForCloning(val))),
      tap(() => console.log(this.cloneSubject.value)),
    ).subscribe();

    return this.http.post<Instruction>(
      `/api/frontend/instructions/`,
      this.cloneSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Instruction> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Instruction);
      })
    );
  }

  deleteInstruction(id: number): Observable<Instruction> {
    return this.http.delete<Instruction>(
      `/api/frontend/instructions/${id}/`,
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Instruction> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Instruction);
      }),
    );
  }

  deactivateInstruction(id: number): Observable<Instruction> {
    console.log('Deactivate Instruction', id);
    /* TODO: Fehler in Deaktivierung finden --> PUT-Request wird abgesetzt und angenommen aber hat keine Wirkung */
    this.getInstruction(id).pipe(
      takeUntil(this.destroySubject),
      tap(val => {
        val.deprecated = true;
        this.deactivateSubject.next(val);
      }),
      tap(() => console.log(this.deactivateSubject.value)),
    ).subscribe();

    return this.http.put<Instruction>(
      `/api/frontend/instructions/${id}/`,
      this.deactivateSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Instruction> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Instruction);
      }),
    );
  }

  createInstruction(topic: number, date: string): Observable<Instruction> {
    this.createSubject.next({topicId: topic, instruction: {startDate: date} as Event } as Instruction);

    return this.http.post<Instruction>(
      `/api/frontend/instructions/`,
      this.createSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Instruction> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Instruction);
      }),
    );
  }

  tranformInstructionForCloning(instruction: Instruction): any {
    delete instruction.id;
    delete instruction.reference;
    delete instruction.instruction.id;
    instruction.meetings.forEach((meeting) => delete meeting.id);
    return instruction;
  }
}
