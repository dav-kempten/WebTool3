import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

const JSON_HEADERS = new HttpHeaders({
  Accept: 'application/json',
  'Accept-Language': 'de',
});

export interface SupportRequest {
  subject: string;
  message: string;
}

export interface SupportResult {
  ok: boolean;
  /** What to show the sender — the backend's wording when it supplied one. */
  detail: string;
}

const FALLBACK_ERROR = 'Die Nachricht konnte nicht gesendet werden.';

@Injectable({ providedIn: 'root' })
export class SupportService {
  private http = inject(HttpClient);

  send(request: SupportRequest): Observable<SupportResult> {
    return this.http
      .post<{ detail?: string }>('/api/frontend/support/', request, { headers: JSON_HEADERS })
      .pipe(
        map((body) => ({ ok: true, detail: body?.detail ?? 'Deine Nachricht ist unterwegs.' })),
        catchError((error: HttpErrorResponse) =>
          of({ ok: false, detail: describe(error) }),
        ),
      );
  }
}

/**
 * Field errors come back per field, a refused send as `detail`. Both are shown
 * as they are, so the sender learns what to change instead of a generic
 * "something went wrong".
 */
function describe(error: HttpErrorResponse): string {
  const body = error.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object') {
    if (typeof body.detail === 'string') {
      return body.detail;
    }
    const messages = Object.values(body as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === 'string');
    if (messages.length) {
      return messages.join(' ');
    }
  }
  return FALLBACK_ERROR;
}
