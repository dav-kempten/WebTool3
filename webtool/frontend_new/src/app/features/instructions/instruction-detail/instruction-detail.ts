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
import {
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

import { InstructionsStore } from '../../../core/stores/instructions.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { NamesStore } from '../../../core/stores/names.store';
import { EventsStore } from '../../../core/stores/events.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { AutoSaveService } from '../../../core/services/auto-save.service';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import { Instruction } from '../../../models/instruction';
import { Event } from '../../../models/event';
import {
  fromIsoDate,
  relaxedMinDate,
  toIsoDate,
  tomorrow,
} from '../../../shared/util/date';
import { timeFormatValidator } from '../../../shared/util/validators';
import { describeSaveErrorPath } from '../../../shared/util/save-error';

@Component({
  selector: 'avk-instruction-detail',
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
  templateUrl: './instruction-detail.html',
  styleUrl: '../../../shared/styles/detail-page.scss',
})
export class InstructionDetail {
  readonly id = input.required<string>();

  private instructions = inject(InstructionsStore);
  private values = inject(ValuesStore);
  private names = inject(NamesStore);
  private events = inject(EventsStore);
  private auth = inject(AuthService);
  private confirm = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private breadcrumb = inject(BreadcrumbService);
  readonly autoSave = inject(AutoSaveService);

  private readonly instructionId = computed(() => Number(this.id()));
  readonly instruction = computed<Instruction | undefined>(
    () => this.instructions.instructionById()[this.instructionId()],
  );
  readonly topic = computed(() =>
    this.values.topicById().get(this.instruction()?.topicId ?? -1),
  );

  /**
   * Special courses define their own title, requirements and equipment instead
   * of inheriting them from the topic. Reads through the entity, which the form
   * mirrors on every change, so the hints react to the checkbox immediately.
   */
  readonly isSpecial = computed(() => this.instruction()?.isSpecial ?? false);

  /** Field labels from the most recent failed save, for an inline hint next to the auto-save status. */
  readonly saveErrorSummary = computed(() =>
    this.instructions
      .lastSaveErrors()
      .map((e) => describeSaveErrorPath(e.path))
      .join(', '),
  );
  /** Read-only view of the requirements already defined on the topic. */
  readonly topicQualificationNames = computed(() => {
    const topic = this.topic();
    if (!topic) {
      return '';
    }
    const byId = this.values.topicById();
    return topic.qualificationIds
      .map((id) => byId.get(id)?.title)
      .filter(Boolean)
      .join(', ');
  });
  readonly topicEquipmentNames = computed(() => {
    const topic = this.topic();
    if (!topic) {
      return '';
    }
    const byId = this.values.equipmentById();
    return topic.equipmentIds
      .map((id) => byId.get(id)?.name)
      .filter(Boolean)
      .join(', ');
  });
  readonly isIndoor = computed(
    () => this.values.categoryById().get(this.instruction()?.categoryId ?? -1)?.indoor ?? false,
  );

  private readonly permission = this.auth.permission;
  readonly isOwner = computed(
    () => this.permission().guideId === this.instruction()?.guideId,
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
  readonly locked = computed(
    () => this.isOwner() && (this.instruction()?.stateId ?? 0) > 2,
  );

  readonly stateOptions = computed(() => {
    const states = this.values.states();
    if (!this.isOwner()) {
      return states;
    }
    // Owners may only pick In Arbeit/Fertig, but the current state must stay
    // in the list so the (locked) select can still display e.g. "Veröffentlicht".
    const currentId = this.instruction()?.stateId;
    return states.filter((s) => s.id <= 2 || s.id === currentId);
  });
  readonly equipmentOptions = this.values.equipments;
  readonly qualificationOptions = this.values.topics;
  readonly approximateOptions = this.values.approximates;
  readonly nameOptions = computed(() =>
    Array.from(this.names.nameById().values()).map((n) => ({
      id: n.id,
      label: `${n.firstName} ${n.lastName}`,
    })),
  );

  form = signal<FormGroup | undefined>(undefined);
  /** Id of the course the form was last built for; rebuilds when navigating to a different course. */
  private builtId: number | null = null;

  /** See tour-detail: relaxed for events that already lie in the past. */
  readonly minDate = signal<Date>(tomorrow());
  readonly showEvent = signal(false);
  readonly selectedIsMain = signal(false);
  selectedEventForm = signal<FormGroup | undefined>(undefined);
  private selectedEventId: number | null = null;

  constructor() {
    effect(() => {
      const id = this.instructionId();
      this.values.loadValues();
      this.names.loadNames();
      if (id && !this.instruction()) {
        this.instructions.loadInstruction(id);
      }
    });

    effect(() => {
      const instruction = this.instruction();
      if (!instruction || this.builtId === instruction.id) {
        return;
      }
      const main = this.events.entityMap()[instruction.instructionId];
      if (!main) {
        return;
      }
      this.builtId = instruction.id;
      this.buildForm(instruction);
      this.autoSave.start({
        form: () => this.form(),
        save: () => this.persist(true),
      });
    });

    // Show the course's reference code (e.g. "VHF-601") instead of "#id" in the breadcrumb.
    effect(() => {
      this.breadcrumb.setDetailTitle(this.instruction()?.reference || null);
    });
  }

  private buildForm(instruction: Instruction): void {
    const group = this.fb.group({
      id: [instruction.id],
      reference: [instruction.reference],
      guideId: [instruction.guideId],
      teamIds: [instruction.teamIds],
      topicId: [instruction.topicId],
      categoryId: [instruction.categoryId],
      kvLink: [instruction.kvLink],
      ladiesOnly: [instruction.ladiesOnly],
      isSpecial: [instruction.isSpecial],
      qualificationIds: [instruction.qualificationIds],
      preconditions: [instruction.preconditions],
      equipmentIds: [instruction.equipmentIds],
      miscEquipment: [instruction.miscEquipment],
      equipmentService: [instruction.equipmentService],
      admission: [instruction.admission],
      advances: [instruction.advances],
      advancesInfo: [instruction.advancesInfo],
      extraCharges: [instruction.extraCharges],
      extraChargesInfo: [instruction.extraChargesInfo],
      minQuantity: [instruction.minQuantity],
      maxQuantity: [instruction.maxQuantity],
      curQuantity: [instruction.curQuantity],
      stateId: [instruction.stateId],
      comment: [instruction.comment],
      message: [instruction.message],
    });

    group.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.instructions.updateLocal(instruction.id, value as Partial<Instruction>);
    });

    this.form.set(group);
  }

  // --- meetings table ---
  readonly eventRows = computed(() => {
    const instruction = this.instruction();
    if (!instruction) {
      return [];
    }
    return this.events.eventsByIds([
      instruction.instructionId,
      ...instruction.meetingIds,
    ]);
  });

  approximateName(id: number | null): string {
    return id == null ? '' : (this.values.approximateById().get(id)?.name ?? '');
  }

  selectEvent(event: Event, index: number): void {
    this.selectedIsMain.set(index === 0);
    this.selectedEventId = event.id;
    this.minDate.set(relaxedMinDate(fromIsoDate(event.startDate)));
    this.selectedEventForm.set(
      this.fb.group({
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
      }),
    );
    this.showEvent.set(true);
  }

  applyEvent(): void {
    const form = this.selectedEventForm();
    if (!form || this.selectedEventId == null) {
      return;
    }
    const value = form.getRawValue();
    // Route through the store so the list summary updates immediately too.
    this.instructions.updateEventLocal(this.selectedEventId, {
      ...value,
      startDate: toIsoDate(value.startDate) ?? '',
      endDate: toIsoDate(value.endDate),
    });
    // Mark the main form dirty so the next save/auto-save persists meeting edits.
    this.form()?.markAsDirty();
  }

  addMeeting(): void {
    const instruction = this.instruction();
    if (instruction) {
      this.instructions.addMeeting({ instruction, isIndoor: this.isIndoor() });
    }
  }

  removeMeeting(eventId: number): void {
    const instruction = this.instruction();
    if (!instruction) {
      return;
    }
    this.confirm.confirm({
      header: 'Termin entfernen',
      message: 'Diesen Termin entfernen?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Entfernen',
      rejectLabel: 'Abbrechen',
      accept: () => this.instructions.removeMeeting({ instruction, eventId }),
    });
  }

  persist(silent = false): void {
    const instruction = this.instruction();
    if (instruction) {
      this.instructions.save({ instruction, silent });
    }
  }

  save(): void {
    this.persist(false);
    this.form()?.markAsPristine();
  }

  confirmDelete(): void {
    const instruction = this.instruction();
    if (!instruction) {
      return;
    }
    this.confirm.confirm({
      header: `Kurs #${instruction.id}`,
      message: 'Kurs endgültig löschen?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Kurs löschen',
      rejectLabel: 'Abbrechen',
      accept: () => this.instructions.remove(instruction.id),
    });
  }
}
