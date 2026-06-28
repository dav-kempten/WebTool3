import { Component, inject } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { BreadcrumbService } from '../breadcrumb.service';

@Component({
  selector: 'avk-breadcrumb-bar',
  standalone: true,
  imports: [BreadcrumbModule],
  template: `
    @if (breadcrumb.items().length) {
      <p-breadcrumb
        class="avk-breadcrumb"
        [model]="breadcrumb.items()"
        [home]="breadcrumb.home"
      />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .avk-breadcrumb {
        max-width: var(--avk-content-max-width);
        margin: 0 auto;
        padding: 0.5rem 1.25rem 0;
      }
    `,
  ],
})
export class BreadcrumbBar {
  protected breadcrumb = inject(BreadcrumbService);
}
