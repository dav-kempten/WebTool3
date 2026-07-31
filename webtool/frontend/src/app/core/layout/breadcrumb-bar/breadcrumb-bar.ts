import { Component, inject } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { BreadcrumbService } from '../breadcrumb.service';

@Component({
  selector: 'avk-breadcrumb-bar',
  standalone: true,
  imports: [BreadcrumbModule],
  template: `
    @if (breadcrumb.items().length) {
      <!-- Divider lives inside the @if so it disappears together with the trail
           on routes without breadcrumbs (e.g. the dashboard). -->
      <span class="avk-divider" aria-hidden="true"></span>
      <p-breadcrumb
        class="avk-breadcrumb"
        [model]="breadcrumb.items()"
        [home]="breadcrumb.home"
      />
    }
  `,
  styles: [
    `
      /* Rendered inside the menubar's #start slot, so the trail shares the menu
         row instead of occupying a strip of its own. */
      :host {
        display: flex;
        align-items: center;
      }

      .avk-divider {
        width: 1px;
        height: 1.25rem;
        margin: 0 0.75rem;
        background: var(--p-content-border-color, rgb(0 0 0 / 12%));
      }

      .avk-breadcrumb {
        padding: 0;
        background: transparent;
      }

      .avk-breadcrumb ::ng-deep .p-breadcrumb-item-link {
        padding: 0;
      }
    `,
  ],
})
export class BreadcrumbBar {
  protected breadcrumb = inject(BreadcrumbService);
}
