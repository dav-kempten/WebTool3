import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ConfirmationService } from 'primeng/api';

import { SessionsStore } from '../../../core/stores/sessions.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { NamesStore } from '../../../core/stores/names.store';
import { EventsStore } from '../../../core/stores/events.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { AutoSaveService } from '../../../core/services/auto-save.service';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import { Session } from '../../../models/session';
import {
  fromIsoDate,
  relaxedMinDate,
  toIsoDate,
  tomorrow,
} from '../../../shared/util/date';
import { timeFormatValidator } from '../../../shared/util/validators';
import { describeSaveErrorPath } from '../../../shared/util/save-error';

@Component({
  selector: 'avk-session-detail',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    DatePipe,
    CardModule,
    ButtonModule,
    DialogModule,
    TableModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    TooltipModule,
    MessageModule,
  ],
  providers: [AutoSaveService],
  templateUrl: './session-detail.html',
  styleUrl: '../../../shared/styles/detail-page.scss',
})
export class SessionDetail {
  readonly id = input.required<string>();

  private sessions = inject(SessionsStore);
  private values = inject(ValuesStore);
  private names = inject(NamesStore);
  private events = inject(EventsStore);
  private auth = inject(AuthService);
  private confirm = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private breadcrumb = inject(BreadcrumbService);
  readonly autoSave = inject(AutoSaveService);

  private readonly sessionId = computed(() => Number(this.id()));
  readonly session = computed<Session | undefined>(
    () => this.sessions.sessionById()[this.sessionId()],
  );
  readonly collective = computed(() =>
    this.values.collectiveById().get(this.session()?.collectiveId ?? -1),
  );

  /** Field labels from the most recent failed save, for an inline hint next to the auto-save status. */
  readonly saveErrorSummary = computed(() =>
    this.sessions
      .lastSaveErrors()
      .map((e) => describeSaveErrorPath(e.path))
      .join(', '),
  );

  private readonly permission = this.auth.permission;
  private readonly managedCollectiveIds = computed(() => {
    const guideId = this.permission().guideId;
    return new Set(
      this.values
        .collectives()
        .filter((c) => c.managers.includes(guideId ?? -1))
        .map((c) => c.id),
    );
  });
  readonly isStaff = computed(
    () => this.permission().permissionLevel >= PermissionLevel.coordinator,
  );
  readonly canView = computed(() => {
    const session = this.session();
    if (!session) {
      return this.isStaff();
    }
    return this.isStaff() || this.managedCollectiveIds().has(session.collectiveId);
  });

  readonly stateOptions = this.values.states;
  /** Only tour categories — instruction/collective categories don't apply here. */
  readonly categoryOptions = computed(() =>
    this.values.categories().filter((c) => c.tour),
  );
  readonly equipmentOptions = this.values.equipments;
  readonly approximateOptions = this.values.approximates;
  readonly nameOptions = computed(() =>
    Array.from(this.names.nameById().values()).map((n) => ({
      id: n.id,
      label: `${n.firstName} ${n.lastName}`,
    })),
  );

  form = signal<FormGroup | undefined>(undefined);
  private built = false;

  /** See tour-detail: relaxed for events that already lie in the past. */
  readonly minDate = signal<Date>(tomorrow());
  readonly showEvent = signal(false);
  eventForm = signal<FormGroup | undefined>(undefined);

  constructor() {
    effect(() => {
      const id = this.sessionId();
      this.values.loadValues();
      this.names.loadNames();
      if (id && !this.session()) {
        this.sessions.loadSession(id);
      }
    });

    // Show the session's reference code instead of "#id" in the breadcrumb.
    effect(() => {
      this.breadcrumb.setDetailTitle(this.session()?.reference || null);
    });

    effect(() => {
      const session = this.session();
      if (!session || this.built) {
        return;
      }
      const event = this.events.entityMap()[session.sessionId];
      if (!event) {
        return;
      }
      this.built = true;
      this.buildForm(session);
      this.autoSave.start({
        form: () => this.form(),
        save: () => this.persist(true),
      });
    });
  }

  private buildForm(session: Session): void {
    const group = this.fb.group({
      id: [session.id],
      reference: [session.reference],
      guideId: [session.guideId],
      teamIds: [session.teamIds],
      speaker: [session.speaker],
      collectiveId: [session.collectiveId],
      ladiesOnly: [session.ladiesOnly],
      categoryIds: [session.categoryIds],
      miscCategory: [session.miscCategory],
      equipmentIds: [session.equipmentIds],
      miscEquipment: [session.miscEquipment],
      message: [session.message],
      comment: [session.comment],
      stateId: [session.stateId],
    });

    group.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.sessions.updateLocal(session.id, value as Partial<Session>);
    });

    this.form.set(group);
  }

  readonly sessionEvent = computed(() => {
    const session = this.session();
    return session ? this.events.entityMap()[session.sessionId] : undefined;
  });

  approximateName(id: number | null): string {
    return id == null ? '' : (this.values.approximateById().get(id)?.name ?? '');
  }

  openEvent(): void {
    const event = this.sessionEvent();
    if (!event) {
      return;
    }
    this.minDate.set(relaxedMinDate(fromIsoDate(event.startDate)));
    this.eventForm.set(
      this.fb.group({
        name: [event.name],
        description: [event.description],
        startDate: [fromIsoDate(event.startDate)],
        startTime: [event.startTime, timeFormatValidator()],
        approximateId: [event.approximateId],
        endDate: [fromIsoDate(event.endDate)],
        endTime: [event.endTime, timeFormatValidator()],
        rendezvous: [event.rendezvous],
        location: [event.location],
      }),
    );
    this.showEvent.set(true);
  }

  applyEvent(): void {
    const form = this.eventForm();
    const event = this.sessionEvent();
    if (!form || !event) {
      return;
    }
    const value = form.getRawValue();
    this.events.updateEvent(event.id, {
      ...value,
      startDate: toIsoDate(value.startDate) ?? '',
      endDate: toIsoDate(value.endDate),
    });
    this.form()?.markAsDirty();
    this.showEvent.set(false);
  }

  persist(silent = false): void {
    const session = this.session();
    if (session) {
      this.sessions.save({ session, silent });
    }
  }

  save(): void {
    this.persist(false);
    this.form()?.markAsPristine();
  }

  confirmDelete(): void {
    const session = this.session();
    if (!session) {
      return;
    }
    this.confirm.confirm({
      header: `Gruppentermin #${session.id}`,
      message: 'Gruppentermin endgültig löschen?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      accept: () => this.sessions.remove(session.id),
    });
  }
}