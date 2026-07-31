import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AbstractControl } from '@angular/forms';

export interface AutoSaveConfig {
  /** Returns the form to watch (may be undefined until data has loaded). */
  form: () => AbstractControl | null | undefined;
  /** Performs the actual persistence (e.g. dispatch an upsert to the store). */
  save: () => void;
  /** Auto-save period in ms. Defaults to 2 minutes. */
  intervalMs?: number;
}

/**
 * Drives a periodic auto-save for a detail form. Provide it at the component
 * level (`providers: [AutoSaveService]`) so each detail page gets its own timer.
 *
 * A save fires only when the watched form is both `dirty` and `valid`; after a
 * successful save the form is marked pristine so the next tick is a no-op until
 * the user edits again. A final save is attempted when the component is destroyed.
 */
@Injectable()
export class AutoSaveService {
  private destroyRef = inject(DestroyRef);
  private started = false;

  /** Timestamp of the most recent auto-save, for display in the template. */
  readonly lastSaved = signal<Date | null>(null);
  /** Allows temporarily pausing auto-save (e.g. while a dialog is open). */
  readonly enabled = signal(true);

  start(config: AutoSaveConfig): void {
    if (this.started) {
      return;
    }
    this.started = true;
    const period = config.intervalMs ?? 120_000;

    interval(period)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tick(config));

    this.destroyRef.onDestroy(() => this.tick(config));
  }

  /** Forces a save attempt right now (respects the dirty/valid guard). */
  flush(config: AutoSaveConfig): void {
    this.tick(config);
  }

  private tick(config: AutoSaveConfig): void {
    if (!this.enabled()) {
      return;
    }
    const form = config.form();
    if (form && form.dirty && form.valid) {
      config.save();
      form.markAsPristine();
      this.lastSaved.set(new Date());
    }
  }
}
