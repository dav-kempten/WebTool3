import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

  ngOnInit(): void {
    // Warm the shared reference-data caches once for the whole app.
    this.valuesStore.loadValues();
    this.namesStore.loadNames();
  }
}
