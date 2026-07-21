import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DestroyRef } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ConfirmationService } from 'primeng/api';

import { ToursStore } from '../../../core/stores/tours.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { NamesStore } from '../../../core/stores/names.store';
import { EventsStore } from '../../../core/stores/events.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { AutoSaveService } from '../../../core/services/auto-save.service';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import { Tour } from '../../../models/tour';
import { Event } from '../../../models/event';
import { fromIsoDate, toIsoDate, tomorrow } from '../../../shared/util/date';
import { timeFormatValidator } from '../../../shared/util/validators';
import { describeSaveErrorPath } from '../../../shared/util/save-error';

type EventKind = 'tour' | 'deadline' | 'preliminary';

@Component({
  selector: 'avk-tour-detail',
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
    InputNumberModule,
    TextareaModule,
    TooltipModule,
    MessageModule,
  ],
  providers: [AutoSaveService],
  templateUrl: './tour-detail.html',
  styleUrl: '../../../shared/styles/detail-page.scss',
})
export class TourDetail {
  /** Route param bound via withComponentInputBinding(). */
  readonly id = input.required<string>();

  private tours = inject(ToursStore);
  private values = inject(ValuesStore);
  private names = inject(NamesStore);
  private events = inject(EventsStore);
  private auth = inject(AuthService);
  private confirm = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private pdf = inject(PdfExportService);
  private breadcrumb = inject(BreadcrumbService);
  readonly autoSave = inject(AutoSaveService);

  private readonly tourId = computed(() => Number(this.id()));
  readonly tour = computed<Tour | undefined>(() => this.tours.tourById()[this.tourId()]);
  readonly category = computed(() =>
    this.values.categoryById().get(this.tour()?.categoryId ?? -1),
  );

  /** Field labels from the most recent failed save, for an inline hint next to the auto-save status. */
  readonly saveErrorSummary = computed(() =>
    this.tours
      .lastSaveErrors()
      .map((e) => describeSaveErrorPath(e.path))
      .join(', '),
  );

  // --- permissions ---
  private readonly permission = this.auth.permission;
  readonly isOwner = computed(
    () => this.permission().guideId === this.tour()?.guideId,
  );
  readonly canView = computed(() => {
    const level = this.permission().permissionLevel;
    if (level >= PermissionLevel.coordinator) {
      return true;
    }
    if (level === PermissionLevel.guide) {
      return this.isOwner();
    }
    return false;
  });
  /** Owner may only edit while the tour is still In Arbeit/Fertig (state <= 2). */
  readonly locked = computed(
    () => this.isOwner() && (this.tour()?.stateId ?? 0) > 2,
  );

  // --- option lists ---
  readonly stateOptions = computed(() => {
    const states = this.values.states();
    if (!this.isOwner()) {
      return states;
    }
    // Owners may only pick In Arbeit/Fertig, but the current state must stay
    // in the list so the (locked) select can still display e.g. "Veröffentlicht".
    const currentId = this.tour()?.stateId;
    return states.filter((s) => s.id <= 2 || s.id === currentId);
  });
  readonly skillOptions = computed(() =>
    this.values.skills().filter((s) => s.categoryId === this.tour()?.categoryId),
  );
  readonly fitnessOptions = computed(() =>
    this.values.fitness().filter((f) => f.categoryId === this.tour()?.categoryId),
  );
  readonly equipmentOptions = this.values.equipments;
  readonly qualificationOptions = this.values.topics;
  readonly categoryOptions = computed(() =>
    this.values.categories().filter((c) => c.tour),
  );
  readonly approximateOptions = this.values.approximates;
  readonly nameOptions = computed(() =>
    this.names.nameById
      ? Array.from(this.names.nameById().values()).map((n) => ({
          id: n.id,
          label: `${n.firstName} ${n.lastName}`,
        }))
      : [],
  );

  // --- forms ---
  form = signal<FormGroup | undefined>(undefined);
  eventForms = signal<FormArray | undefined>(undefined);
  private built = false;

  // --- event dialog ---
  readonly minDate = tomorrow();
  readonly showEvent = signal(false);
  readonly selectedKind = signal<EventKind>('tour');
  selectedEventForm = signal<FormGroup | undefined>(undefined);

  constructor() {
    // Trigger loads.
    effect(() => {
      const id = this.tourId();
      this.values.loadValues();
      this.names.loadNames();
      if (id && !this.tour()) {
        this.tours.loadTour(id);
      }
    });

    // Build the editable forms once the entity (and its events) are available.
    effect(() => {
      const tour = this.tour();
      if (!tour || this.built) {
        return;
      }
      const events = this.events.eventsByIds([
        tour.tourId,
        tour.deadlineId,
        tour.preliminaryId,
      ]);
      if (events.length === 0) {
        return;
      }
      this.built = true;
      this.buildForms(tour, events);
      this.autoSave.start({
        form: () => this.form(),
        save: () => this.persist(true),
      });
    });

    // Show the tour's reference code (e.g. "VHF-601") instead of "#id" in the breadcrumb.
    effect(() => {
      this.breadcrumb.setDetailTitle(this.tour()?.reference || null);
    });
  }

  private buildForms(tour: Tour, events: Event[]): void {
    const group = this.fb.group({
      id: [tour.id],
      reference: [tour.reference],
      guideId: [tour.guideId],
      teamIds: [tour.teamIds],
      categoryId: [tour.categoryId],
      categoryIds: [tour.categoryIds],
      info: [tour.info],
      youthOnTour: [tour.youthOnTour],
      relaxed: [tour.relaxed],
      mountainBus: [tour.mountainBus],
      kvLink: [tour.kvLink],
      ladiesOnly: [tour.ladiesOnly],
      qualificationIds: [tour.qualificationIds],
      preconditions: [tour.preconditions],
      equipmentIds: [tour.equipmentIds],
      miscEquipment: [tour.miscEquipment],
      equipmentService: [tour.equipmentService],
      skillId: [tour.skillId],
      fitnessId: [tour.fitnessId],
      admission: [tour.admission],
      advances: [tour.advances],
      advancesInfo: [tour.advancesInfo],
      extraCharges: [tour.extraCharges],
      extraChargesInfo: [tour.extraChargesInfo],
      minQuantity: [tour.minQuantity],
      maxQuantity: [tour.maxQuantity],
      curQuantity: [tour.curQuantity],
      stateId: [tour.stateId],
      comment: [tour.comment],
      message: [tour.message],
    });

    group.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.tours.updateLocal(tour.id, value as Partial<Tour>);
    });

    const array = new FormArray(
      events.map((event) => this.buildEventForm(event)),
    );
    this.form.set(group);
    this.eventForms.set(array);
  }

  private buildEventForm(event: Event): FormGroup {
    const group = this.fb.group({
      id: [event.id],
      title: [event.title],
      name: [event.name],
      description: [event.description],
      startDate: [fromIsoDate(event.startDate)],
      startTime: [event.startTime, timeFormatValidator()],
      approximateId: [event.approximateId],
      endDate: [fromIsoDate(event.endDate)],
      endTime: [event.endTime, timeFormatValidator()],
      rendezvous: [event.rendezvous],
      location: [event.location],
      reservationService: [event.reservationService],
      lea: [event.lea],
      source: [event.source],
      link: [event.link],
      map: [event.map],
      distal: [event.distal],
      distance: [event.distance],
      publicTransport: [event.publicTransport],
      shuttleService: [event.shuttleService],
    });

    group.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      // Route through the store so the list summary updates immediately too.
      this.tours.updateEventLocal(event.id, {
        ...(value as Partial<Event>),
        startDate: toIsoDate(value.startDate) ?? '',
        endDate: toIsoDate(value.endDate),
      });
    });

    return group;
  }

  // --- event table interaction ---
  readonly eventRows = computed(() => {
    const tour = this.tour();
    if (!tour) {
      return [];
    }
    return this.events.eventsByIds([
      tour.tourId,
      tour.deadlineId,
      tour.preliminaryId,
    ]);
  });

  approximateName(id: number | null): string {
    if (id == null) {
      return '';
    }
    return this.values.approximateById().get(id)?.name ?? '';
  }

  selectEvent(index: number): void {
    const array = this.eventForms();
    if (!array) {
      return;
    }
    this.selectedKind.set(
      index === 0 ? 'tour' : index === 1 ? 'deadline' : 'preliminary',
    );
    this.selectedEventForm.set(array.at(index) as FormGroup);
    this.showEvent.set(true);
  }

  // --- actions ---
  persist(silent = false): void {
    const tour = this.tour();
    if (tour) {
      this.tours.save({ tour, silent });
    }
  }

  save(): void {
    this.persist(false);
    this.form()?.markAsPristine();
  }

  confirmDelete(): void {
    const tour = this.tour();
    if (!tour) {
      return;
    }
    this.confirm.confirm({
      header: `Tour #${tour.id}`,
      message: 'Tour endgültig löschen?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Tour löschen',
      rejectLabel: 'Abbrechen',
      accept: () => this.tours.remove(tour.id),
    });
  }

  preview(): void {
    const tour = this.tour();
    if (!tour) {
      return;
    }
    this.pdf.exportTour(tour, this.category(), this.eventRows(), (id) =>
      this.approximateName(id),
    );
  }
}
