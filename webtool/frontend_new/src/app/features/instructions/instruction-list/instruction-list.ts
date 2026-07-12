import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';

import { InstructionsStore } from '../../../core/stores/instructions.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { NamesStore } from '../../../core/stores/names.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { States, StatesGroup, getStatesOfGroup } from '../../../models/value';
import { InstructionSummary } from '../../../models/instruction';
import { toIsoDate } from '../../../shared/util/date';
import { InstructionCreateDialog } from '../../../shared/dialogs/instruction-create-dialog/instruction-create-dialog';

interface InstructionRow extends InstructionSummary {
  stateName: string;
}

@Component({
  selector: 'avk-instruction-list',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    SelectButtonModule,
    DatePickerModule,
    InputTextModule,
    InstructionCreateDialog,
  ],
  templateUrl: './instruction-list.html',
  styleUrl: '../../tours/tour-list/tour-list.scss',
})
export class InstructionList implements OnInit {
  private instructions = inject(InstructionsStore);
  private values = inject(ValuesStore);
  private names = inject(NamesStore);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private confirm = inject(ConfirmationService);

  readonly part = toSignal(this.route.fragment, { initialValue: null });
  readonly stateGroup = signal<StatesGroup>(StatesGroup.Active);

  readonly partOptions = [
    { label: 'Alle', value: null },
    { label: 'Sommer', value: 'summer' },
    { label: 'Winter', value: 'winter' },
    { label: 'Indoor', value: 'indoor' },
  ];

  readonly stateGroupOptions = [
    { label: 'Aktive Kurse', value: StatesGroup.Active },
    { label: 'Alle Kurse', value: StatesGroup.All },
    { label: 'Fertige Kurse', value: StatesGroup.Finished },
  ];

  private readonly permission = this.auth.permission;

  readonly canAdd = computed(
    () => this.permission().permissionLevel >= PermissionLevel.coordinator,
  );

  readonly rows = computed<InstructionRow[]>(() => {
    const part = this.part();
    const group = getStatesOfGroup(this.stateGroup());
    const stateMap = this.values.stateById();
    const nameMap = this.names.nameById();
    const perm = this.permission();

    return this.instructions
      .summaries()
      .filter(
        (t) =>
          (part === 'winter' && t.winter) ||
          (part === 'summer' && t.summer) ||
          (part === 'indoor' && t.indoor) ||
          !part,
      )
      .filter((t) => group.includes(t.stateId))
      .filter((t) =>
        perm.permissionLevel === PermissionLevel.guide
          ? perm.guideId === t.guideId
          : true,
      )
      .map((t) => {
        const name = nameMap.get(t.guideId);
        return {
          ...t,
          stateName: stateMap.get(t.stateId)?.state ?? '',
          guide: name ? `${name.firstName} ${name.lastName}` : '',
        };
      });
  });

  // create dialog (shared component)
  readonly showCreate = signal(false);

  // clone dialog
  readonly showClone = signal(false);
  readonly cloneForm = this.fb.group({
    instructionId: this.fb.control<number | null>(null),
    startDate: this.fb.control<Date | null>(null),
    endDate: this.fb.control<Date | null>(null),
  });

  ngOnInit(): void {
    // ensureSummaries: a hard reload here would overwrite locally synced,
    // not-yet-saved detail edits; every save refreshes the summaries anyway.
    this.instructions.ensureSummaries();
    this.values.loadValues();
    this.names.loadNames();
  }

  setPart(value: string | null): void {
    void this.router.navigate(['/instructions'], { fragment: value ?? undefined });
  }

  canModify(row: InstructionSummary): boolean {
    const perm = this.permission();
    return (
      perm.permissionLevel >= PermissionLevel.coordinator ||
      perm.guideId === row.guideId
    );
  }

  canDelete(row: InstructionSummary): boolean {
    return (
      this.permission().permissionLevel >= PermissionLevel.coordinator &&
      !getStatesOfGroup(StatesGroup.Finished).includes(row.stateId as States)
    );
  }

  select(row: InstructionSummary): void {
    if (this.canModify(row)) {
      void this.router.navigate(['/instructions', row.id]);
    }
  }

  openClone(row: InstructionSummary): void {
    this.cloneForm.reset();
    this.cloneForm.patchValue({ instructionId: row.id });
    this.showClone.set(true);
  }

  clone(): void {
    const value = this.cloneForm.getRawValue();
    if (!value.instructionId || !value.startDate) {
      return;
    }
    this.instructions.cloneById({
      id: value.instructionId,
      startDate: toIsoDate(value.startDate)!,
      endDate: toIsoDate(value.endDate),
    });
    this.showClone.set(false);
  }

  confirmDelete(row: InstructionSummary): void {
    this.confirm.confirm({
      header: 'Kursaktion',
      message: `Kurs ${row.reference} endgültig löschen?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Kurs löschen',
      rejectLabel: 'Abbrechen',
      accept: () => this.instructions.remove(row.id),
    });
  }
}