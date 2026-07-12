import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Tour } from '../../models/tour';
import { Event } from '../../models/event';
import { Category } from '../../models/value';
import { formatIsoDateDe } from '../../shared/util/date';

/**
 * Renders a printable tour summary PDF. A focused port of the old
 * `tour-detail.preview()` using jsPDF's built-in fonts (the custom Calibri
 * face + section logo from the legacy `binaries.ts` can be layered in later).
 */
@Injectable({ providedIn: 'root' })
export class PdfExportService {
  exportTour(
    tour: Tour,
    category: Category | undefined,
    events: Event[],
    approximateName: (id: number | null) => string,
  ): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const [main, deadline, preliminary] = events;

    doc.setFontSize(20);
    doc.text(tour.reference ?? '', 20, 20);

    if (category) {
      doc.setFontSize(13);
      doc.text(category.name, 20, 28);
    }

    doc.setFontSize(13);
    const participants = tour.ladiesOnly
      ? `Teilnehmer: ${tour.minQuantity} - ${tour.maxQuantity}, Tour von Frauen für Frauen`
      : `Teilnehmer: ${tour.minQuantity} - ${tour.maxQuantity}`;
    doc.text(participants, 20, 38);

    if (main) {
      doc.setFontSize(15);
      doc.text('Tourdetails', 20, 52);

      doc.setFontSize(13);
      doc.text(main.name ? `${main.title} - ${main.name}` : (main.title ?? ''), 20, 62);

      const dateLine = main.endDate
        ? `${formatIsoDateDe(main.startDate)} - ${formatIsoDateDe(main.endDate)}, ${this.timeLabel(main, approximateName)}`
        : `${formatIsoDateDe(main.startDate)}, ${this.timeLabel(main, approximateName)}`;
      doc.text(dateLine, 20, 70);

      const description = doc.splitTextToSize(main.description ?? '', 175);
      doc.text(description, 20, 80);

      doc.text(`Ausgangsort: ${main.source ?? ''}`, 20, 180);
      doc.text(`Treffpunkt: ${main.rendezvous ?? ''}`, 20, 186);
      doc.text(`Übernachtung: ${main.location ?? ''}`, 20, 192);
    }

    if (deadline) {
      const extra = preliminary
        ? `Weitere Termine: ${formatIsoDateDe(deadline.startDate)} (Anmeldeschluss), ${formatIsoDateDe(preliminary.startDate)} (Vorbesprechung)`
        : `Weiterer Termin: ${formatIsoDateDe(deadline.startDate)} (Anmeldeschluss)`;
      doc.text(extra, 20, 206);
    }

    doc.save(`${tour.reference ?? 'tour'}.pdf`);
  }

  private timeLabel(
    event: Event,
    approximateName: (id: number | null) => string,
  ): string {
    if (event.startTime) {
      return event.endTime
        ? `${event.startTime} - ${event.endTime} Uhr`
        : `${event.startTime} Uhr`;
    }
    return approximateName(event.approximateId);
  }
}
