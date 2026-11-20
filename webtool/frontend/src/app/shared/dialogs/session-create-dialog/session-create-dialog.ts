import { Component, OnInit, computed, inject, model } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { ResponsiveTooltip } from '../../directives/responsive-tooltip';

import { Collective } from '../../../models/value';
import { SessionsStore } from '../../../core/stores/sessions.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { AuthService } from '../../../core/services/auth.service';
import { Permission, PermissionLevel } from '../../../core/services/permission';
import { toIsoDate, tomorrow } from '../../util/date';

/**
 * Die Gruppen, für die jemand Termine anlegen darf: Fachbereichssprecher und
 * Geschäftsstelle alle, Gruppenleiter die, die sie selbst leiten. Leer heißt,
 * dass jemand gar keine Gruppentermine anlegen darf.
 */
export function creatableCollectives(collectives: Collective[], permission: Permission): Collective[] {
  if (permission.permissionLevel >= PermissionLevel.coordinator) {
    return collectives;
  }
  const guideId = permission.guideId;
  return guideId == null ? [] : collectives.filter((c) => c.managers.includes(guideId));
}

/**
 * "Neuer Gruppentermin" mit Gruppe und Startdatum. Nach dem Anlegen springt
 * der SessionsStore gleich auf die Detailseite des neuen Termins.
 */
@Component({
  selector: 'avk-session-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
    ResponsiveTooltip,
  ],
  templateUrl: './session-create-dialog.html',
  styleUrl: '../../styles/create-dialog.scss',
})
export class SessionCreateDialog implements OnInit {
  private sessions = inject(SessionsStore);
  private values = inject(ValuesStore);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly visible = model(false);

  /** Ein neuer Gruppentermin liegt immer in der Zukunft. */
  readonly minDate = tomorrow();

  readonly collectives = computed(() =>
    creatableCollectives(this.values.collectives(), this.auth.permission()),
  );

  readonly form = this.fb.group({
    collectiveId: this.fb.control<number | null>(null, Validators.required),
    startDate: this.fb.control<Date | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.values.loadValues();
  }

  /** Beim Öffnen leeren, über (onShow) — siehe TourCreateDialog. */
  onOpen(): void {
    this.form.reset();
  }

  create(): void {
    const value = this.form.getRawValue();
    if (!value.collectiveId || !value.startDate) {
      return;
    }
    this.sessions.create({
      collectiveId: value.collectiveId,
      startDate: toIsoDate(value.startDate)!,
    });
    this.visible.set(false);
  }
}
