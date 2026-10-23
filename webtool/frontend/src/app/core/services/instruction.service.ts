import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import {
  Instruction,
  InstructionSummary,
  RawInstruction,
} from '../../models/instruction';
import { Event } from '../../models/event';
import { ActivityPreview } from '../../models/preview';
import { SaveResult, toSaveError } from '../../shared/util/save-error';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

/** Backend GETs carry max-age=86400 — force revalidation (see tour.service.ts). */
const READ_HEADERS = JSON_HEADERS.set('Cache-Control', 'no-cache').set('Pragma', 'no-cache');

export interface CreateInstructionPayload {
  topicId: number;
  startDate: string;
  guideId: number | null;
  isSpecial: boolean;
}

@Injectable({ providedIn: 'root' })
export class InstructionService {
  private http = inject(HttpClient);

  getInstructionSummaries(): Observable<InstructionSummary[]> {
    return this.http
      .get<InstructionSummary[]>('/api/frontend/instructions/', { headers: READ_HEADERS })
      .pipe(catchError(() => of([] as InstructionSummary[])));
  }

  getInstruction(id: number): Observable<RawInstruction | null> {
    if (!id) {
      return of(null);
    }
    return this.http
      .get<RawInstruction>(`/api/frontend/instructions/${id}/`, { headers: READ_HEADERS })
      .pipe(catchError(() => of(null)));
  }

  /** The course as the homepage receives it, also before it is published. */
  getPreview(id: number): Observable<ActivityPreview | null> {
    return this.http
      .get<ActivityPreview>(`/api/frontend/instructions/${id}/preview/`, { headers: READ_HEADERS })
      .pipe(catchError(() => of(null)));
  }

  createInstruction(payload: CreateInstructionPayload): Observable<SaveResult<Instruction>> {
    const body = {
      topicId: payload.topicId,
      instruction: { startDate: payload.startDate } as Event,
      guideId: payload.guideId,
      stateId: 1,
      isSpecial: payload.isSpecial,
    };
    return this.postInstruction(body);
  }

  cloneInstruction(body: unknown): Observable<SaveResult<Instruction>> {
    return this.postInstruction(body);
  }

  /** Keeps the backend's validation errors (e.g. a full booking code space) for the message. */
  private postInstruction(body: unknown): Observable<SaveResult<Instruction>> {
    return this.http.post<Instruction>('/api/frontend/instructions/', body).pipe(
      map((data) => ({ data, errors: [] }) as SaveResult<Instruction>),
      catchError((error: HttpErrorResponse) => of(toSaveError<Instruction>(error))),
    );
  }

  upsertInstruction(id: number, body: unknown): Observable<SaveResult<RawInstruction>> {
    return this.http.put<RawInstruction>(`/api/frontend/instructions/${id}/`, body).pipe(
      map((data) => ({ data, errors: [] }) as SaveResult<RawInstruction>),
      catchError((error: HttpErrorResponse) => of(toSaveError<RawInstruction>(error))),
    );
  }

  deleteInstruction(id: number): Observable<boolean> {
    return this.http.delete(`/api/frontend/instructions/${id}/`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}