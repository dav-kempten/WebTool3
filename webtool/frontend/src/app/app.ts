import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MainMenu } from './core/layout/main-menu/main-menu';
import { ValuesStore } from './core/stores/values.store';
import { NamesStore } from './core/stores/names.store';
import { BUILD_INFO } from './build-info';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DatePipe, ToastModule, ConfirmDialogModule, MainMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  /** Version und Zeitpunkt des Builds, erzeugt von scripts/build-info.mjs. */
  readonly build = BUILD_INFO;

  private valuesStore = inject(ValuesStore);
  private namesStore = inject(NamesStore);

  ngOnInit(): void {
    // Warm the shared reference-data caches once for the whole app.
    this.valuesStore.loadValues();
    this.namesStore.loadNames();
  }
}
