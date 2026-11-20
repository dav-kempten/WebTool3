import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ClaimDefaults, ClaimInput, ClaimKind, ClaimResult } from '../../models/claim';
import { saveDownload } from './printout.service';

/**
 * Abrechnung einer Tour oder eines Kurses: Vorbelegung holen, mit den
 * korrigierten Angaben durchrechnen lassen und als PDF zum Unterschreiben
 * laden. Gespeichert wird dabei nichts (`/api/frontend/<kind>/<id>/claim/`).
 */
@Injectable({ providedIn: 'root' })
export class ClaimService {
  private http = inject(HttpClient);
  private messages = inject(MessageService);

  defaults(kind: ClaimKind, id: number): Observable<ClaimDefaults> {
    return this.http.get<ClaimDefaults>(`/api/frontend/${kind}/${id}/claim/`);
  }

  preview(kind: ClaimKind, id: number, input: ClaimInput): Observable<ClaimResult> {
    return this.http.post<ClaimResult>(`/api/frontend/${kind}/${id}/claim/`, input);
  }

  /** `done` läuft, sobald der Download begonnen hat oder fehlgeschlagen ist. */
  download(kind: ClaimKind, id: number, input: ClaimInput, done?: () => void): void {
    this.http
      .post(`/api/frontend/${kind}/${id}/claim/`, input, {
        observe: 'response',
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      })
      .subscribe({
        next: (response) => {
          saveDownload(response, `Abrechnung-${id}.pdf`);
          done?.();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Abrechnung fehlgeschlagen',
            detail: 'Das PDF konnte nicht erzeugt werden. Bitte die Angaben prüfen und später noch einmal versuchen.',
            life: 10000,
          });
          done?.();
        },
      });
  }
}

