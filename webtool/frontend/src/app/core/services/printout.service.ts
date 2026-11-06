import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';

/** Which detail form the printout belongs to: the URL segment of its API. */
export type PrintoutKind = 'tours' | 'instructions';

/**
 * Downloads the trainer printout of a tour or course: an A5 PDF in the
 * programme booklet's style with every field of the form, rendered by the
 * backend (`GET /api/frontend/<kind>/<id>/printout/`).
 */
@Injectable({ providedIn: 'root' })
export class PrintoutService {
  private http = inject(HttpClient);
  private messages = inject(MessageService);

  /** `done` runs once the download has started or failed, e.g. to clear a spinner. */
  download(kind: PrintoutKind, id: number, done?: () => void): void {
    this.http
      .get(`/api/frontend/${kind}/${id}/printout/`, {
        observe: 'response',
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      })
      .subscribe({
        next: (response) => {
          save(response, `${kind === 'tours' ? 'Tour' : 'Kurs'}-${id}.pdf`);
          done?.();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Ausdruck fehlgeschlagen',
            detail: 'Das PDF konnte nicht erzeugt werden. Bitte später noch einmal versuchen.',
            life: 10000,
          });
          done?.();
        },
      });
  }
}

/** The name the backend gives ("BGT-701_2027-07-10.pdf"), else the fallback. */
export function filenameOf(response: HttpResponse<Blob>, fallback: string): string {
  const header = response.headers.get('Content-Disposition') ?? '';
  return /filename="([^"]+)"/.exec(header)?.[1] ?? fallback;
}

function save(response: HttpResponse<Blob>, fallback: string): void {
  if (!response.body) {
    return;
  }
  const url = URL.createObjectURL(response.body);
  const link = document.createElement('a');
  link.href = url;
  link.download = filenameOf(response, fallback);
  link.click();
  // Let the click take hold before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
