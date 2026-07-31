import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'avk-page-not-found',
  standalone: true,
  imports: [RouterModule, ButtonModule],
  template: `
    <section class="avk-page avk-notfound">
      <h1>404</h1>
      <p>Diese Seite wurde nicht gefunden.</p>
      <p-button routerLink="/dashboard" label="Zum Dashboard" icon="pi pi-home" />
    </section>
  `,
  styles: [
    `
      .avk-notfound {
        text-align: center;
        padding-top: 4rem;

        h1 {
          font-size: 4rem;
          margin: 0;
        }
        p {
          opacity: 0.75;
          margin: 0.5rem 0 1.5rem;
        }
      }
    `,
  ],
})
export class PageNotFound {}
