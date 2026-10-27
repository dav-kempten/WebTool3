import { Directive, Injectable, effect, inject, signal } from '@angular/core';
import { Tooltip } from 'primeng/tooltip';

/**
 * Tracks whether the window has room for a tooltip beside a form field.
 *
 * The threshold is the width of the page container (`--avk-content-max-width`):
 * below it the form fills the window edge to edge, so there is no margin left
 * for a box next to a field. A media query is used rather than a resize
 * listener — it only fires when the threshold is actually crossed.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly query = window.matchMedia('(max-width: 1280px)');
  readonly isNarrow = signal(this.query.matches);

  constructor() {
    this.query.addEventListener('change', (event) => this.isNarrow.set(event.matches));
  }
}

/**
 * Moves tooltips above their field while the window is narrow.
 *
 * PrimeNG places them to the right and, when that does not fit, tries left, top
 * and bottom in turn. In a narrow window none of the horizontal spots fit; the
 * box ends up wherever the last attempt left it, often half outside the screen.
 * Above the field there is always room, so on narrow screens that becomes the
 * first choice and the fallback order runs downwards instead of sideways.
 *
 * Attaching to `[pTooltip]` keeps this out of the templates — every element
 * that already has a tooltip picks it up, as long as the component imports this
 * directive alongside PrimeNG's `Tooltip`.
 */
@Directive({ selector: '[pTooltip]' })
export class ResponsiveTooltip {
  constructor() {
    const tooltip = inject(Tooltip);
    const viewport = inject(ViewportService);

    effect(() => {
      // Nothing binds tooltipPosition in the templates, so this is not
      // overwritten by PrimeNG's own ngOnChanges afterwards.
      tooltip.setOption({ tooltipPosition: viewport.isNarrow() ? 'top' : 'right' });
    });
  }
}
