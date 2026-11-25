import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { DatePipe } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MainMenu } from './core/layout/main-menu/main-menu';
import { ValuesStore } from './core/stores/values.store';
import { NamesStore } from './core/stores/names.store';
import { BUILD_INFO } from './build-info';
import { RELEASE_NOTES } from './release-notes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DatePipe,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    MainMenu,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  /** Version und Zeitpunkt des Builds, erzeugt von scripts/build-info.mjs. */
  readonly build = BUILD_INFO;

  /** Notizen zur gebauten Version; ohne Eintrag entfällt der Infobutton. */
  private readonly noteIndex = RELEASE_NOTES.findIndex(
    (note) => note.version === this.build.version,
  );
  readonly notes = this.noteIndex < 0 ? null : RELEASE_NOTES[this.noteIndex];
  /** Die Vorgängerversion — die Liste steht neueste zuerst. */
  readonly previousVersion =
    this.noteIndex < 0 ? null : (RELEASE_NOTES[this.noteIndex + 1]?.version ?? null);

  readonly showNotes = signal(false);

  private valuesStore = inject(ValuesStore);
  private namesStore = inject(NamesStore);
  private auth = inject(AuthService);
  private router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: '' },
  );
  /** The login page stands alone, without the menu. */
  readonly onLoginPage = computed(() => this.url().startsWith('/login'));
  /** Not before the first navigation, so the menu does not flash up on the way to /login. */
  readonly showHeader = computed(() => this.url() !== '' && !this.onLoginPage());

  constructor() {
    // Logged out (button, or a session the server no longer knows): back to
    // the login page. Only after the first session check, see AuthService.ready.
    effect(() => {
      // The first navigation is the guard's job: it keeps the returnUrl.
      if (this.url() && this.auth.checked() && this.auth.isLoggedOut() && !this.onLoginPage()) {
        void this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit(): void {
    // Warm the shared reference-data caches once for the whole app.
    this.valuesStore.loadValues();
    this.namesStore.loadNames();
  }
}
