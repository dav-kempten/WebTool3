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

function convertDecimal(rawValue: string): number {
  return Number(rawValue.replace('.', ''));
}

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
  private updateSubject = new BehaviorSubject<Instruction>(null);
  private addEventSubject = new BehaviorSubject<Instruction>(null);
  private deleteEventSubject = new BehaviorSubject<Instruction>(null);

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

  cloneInstruction(instruction: Instruction): Observable<Instruction> {
    this.cloneSubject.next(this.tranformInstructionForCloning(instruction));

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
    this.getInstruction(id).pipe(
      takeUntil(this.destroySubject),
      tap(val => {
        val.deprecated = true;
        val.stateId = 7;
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
      })
    );
  }

  createInstruction(topic: number, date: string, guideId: number): Observable<Instruction> {
    this.createSubject.next({topicId: topic, instruction: {startDate: date} as Event, guideId, stateId: 1} as Instruction);

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

  upsertInstruction(instruction: Instruction): Observable<Instruction> {
    this.updateSubject.next(instruction);

    return this.http.put<Instruction>(
      `/api/frontend/instructions/${this.updateSubject.value.id}/`,
      this.updateSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Instruction> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Instruction);
      })
    );
  }

  addEventInstruction(instruction: Instruction, isIndoor: boolean): Observable<Instruction> {
    if (isIndoor) {
      instruction.meetings.push({id: null, startDate: instruction.instruction.startDate, startTime: instruction.instruction.startTime,
        endTime: instruction.instruction.endTime} as Event);
    } else { instruction.meetings.push({id: null, startDate: instruction.instruction.startDate} as Event); }

    this.addEventSubject.next(instruction);

    return this.http.put<Instruction>(
      `/api/frontend/instructions/${this.addEventSubject.value.id}/`,
      this.addEventSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Instruction> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Instruction);
      }),
    );
  }

  deleteEventInstruction(instruction: Instruction, eventId: number): Observable<Instruction> {
    const index = instruction.meetings.map(item => item.id).indexOf(eventId);
    instruction.meetings[index] = {...instruction.meetings[index], deprecated: true};
    this.deleteEventSubject.next(instruction);

    return this.http.put<Instruction>(
      `/api/frontend/instructions/${this.deleteEventSubject.value.id}/`,
      this.deleteEventSubject.value
    ).pipe(
      catchError((error: HttpErrorResponse): Observable<Instruction> => {
        console.log(error.statusText, error.status);
        return of ({id: 0} as Instruction);
      }),
    );
  }

  tranformInstructionForCloning(instruction: Instruction): any {
    const subsetInstruction = JSON.parse(JSON.stringify(instruction));

    delete subsetInstruction.id;
    delete subsetInstruction.reference;
    delete subsetInstruction.instruction.id;
    subsetInstruction.meetings.forEach((meeting) => delete meeting.id);

    subsetInstruction.stateId = 1;
    subsetInstruction.curQuantity = 0;

    return subsetInstruction;
  }
}
