import { Component, computed, input, model } from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';

import { ActivityPreview } from '../../../models/preview';
import { MATERIAL_LIST_URL } from '../../util/links';

/**
 * Shows a tour or course the way the homepage (TYPO3, dav-kempten.de) presents
 * it: title with booking code, the facts list and the description. The content
 * is exactly what the homepage receives; only the look is an approximation.
 */
@Component({
  selector: 'avk-homepage-preview-dialog',
  standalone: true,
  imports: [DialogModule, MessageModule],
  templateUrl: './homepage-preview-dialog.html',
  styleUrl: './homepage-preview-dialog.scss',
})
export class HomepagePreviewDialog {
  readonly visible = model(false);
  /** null while loading, or if the preview could not be fetched. */
  readonly preview = input<ActivityPreview | null>(null);
  readonly loading = input(false);

  readonly dates = computed(() => {
    const p = this.preview();
    return p ? homepageDateRange(p.startDate, p.endDate) : '';
  });

  readonly guide = computed(() => {
    const guide = this.preview()?.guide;
    return guide ? `${guide.firstName} ${guide.lastName}` : '–';
  });

  readonly participants = computed(() => {
    const quantity = this.preview()?.quantity;
    if (!quantity?.max) {
      return '–';
    }
    return quantity.min ? `${quantity.min} bis ${quantity.max} Personen` : `bis ${quantity.max} Personen`;
  });

  readonly fee = computed(() => {
    const admission = Number(this.preview()?.admission ?? 0);
    return `${admission.toLocaleString('de-DE')} €`;
  });

  /** The levels shown as dots, like the homepage's indicators; 99/none is left out. */
  readonly skillLevel = computed(() => requirementLevel(this.preview()?.skill));
  readonly fitnessLevel = computed(() => requirementLevel(this.preview()?.fitness));
  readonly levelDots = [1, 2, 3];
  readonly materialListUrl = MATERIAL_LIST_URL;

  /** "Wandern und Bergsteigen (A)", then the free-text extra equipment, as on the homepage. */
  readonly equipment = computed(() => {
    const equipments = this.preview()?.equipments;
    const items = (equipments?.list ?? []).map((e) => `${e.name} (${e.code})`);
    if (equipments?.misc) {
      items.push(equipments.misc);
    }
    return items;
  });
}

function requirementLevel(level: number | null | undefined): number | null {
  return level != null && level >= 1 && level <= 3 ? level : null;
}

/** "30.10. – 03.11.2026" like the homepage; a single day as "07.11.2026". */
export function homepageDateRange(startDate: string, endDate: string | null): string {
  const [sy, sm, sd] = startDate.split('-');
  if (!endDate || endDate === startDate) {
    return `${sd}.${sm}.${sy}`;
  }
  const [ey, em, ed] = endDate.split('-');
  const start = sy === ey ? `${sd}.${sm}.` : `${sd}.${sm}.${sy}`;
  return `${start} – ${ed}.${em}.${ey}`;
}
