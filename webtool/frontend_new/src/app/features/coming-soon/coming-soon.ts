import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * Temporary placeholder for feature areas (instructions, sessions, talks,
 * trainers) that are ported in Phase 3, so the menu links resolve gracefully.
 */
@Component({
  selector: 'avk-coming-soon',
  standalone: true,
  template: `
    <section class="avk-page" style="text-align:center;padding-top:4rem">
      <i class="pi pi-wrench" style="font-size:3rem;opacity:0.5"></i>
      <h1>{{ title() }}</h1>
      <p style="opacity:0.7">Dieser Bereich wird gerade neu aufgebaut.</p>
    </section>
  `,
})
export class ComingSoon {
  private route = inject(ActivatedRoute);
  readonly title = toSignal(
    this.route.data.pipe(map((data) => (data['breadcrumb'] as string) ?? 'Demnächst')),
    { initialValue: 'Demnächst' },
  );
}
