import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import {
  Instruction,
  InstructionSummary,
  RawInstruction,
} from '../../models/instruction';
import { Event } from '../../models/event';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

export interface CreateInstructionPayload {
  topicId: number;
  startDate: string;
  guideId: number | null;
}

@Injectable({ providedIn: 'root' })
export class InstructionService {
  private http = inject(HttpClient);

  getInstructionSummaries(): Observable<InstructionSummary[]> {
    return this.http
      .get<InstructionSummary[]>('/api/frontend/instructions/', { headers: JSON_HEADERS })
      .pipe(catchError(() => of([] as InstructionSummary[])));
  }

  getInstruction(id: number): Observable<RawInstruction | null> {
    if (!id) {
      return of(null);
    }
    return this.http
      .get<RawInstruction>(`/api/frontend/instructions/${id}/`, { headers: JSON_HEADERS })
      .pipe(catchError(() => of(null)));
  }

  createInstruction(payload: CreateInstructionPayload): Observable<Instruction> {
    const body = {
      topicId: payload.topicId,
      instruction: { startDate: payload.startDate } as Event,
      guideId: payload.guideId,
      stateId: 1,
    };
    return this.http
      .post<Instruction>('/api/frontend/instructions/', body)
      .pipe(catchError(() => of({ id: 0 } as Instruction)));
  }

  cloneInstruction(body: unknown): Observable<Instruction> {
    return this.http
      .post<Instruction>('/api/frontend/instructions/', body)
      .pipe(catchError(() => of({ id: 0 } as Instruction)));
  }

  upsertInstruction(id: number, body: unknown): Observable<RawInstruction | null> {
    return this.http
      .put<RawInstruction>(`/api/frontend/instructions/${id}/`, body)
      .pipe(catchError(() => of(null)));
  }

  deleteInstruction(id: number): Observable<boolean> {
    return this.http.delete(`/api/frontend/instructions/${id}/`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}