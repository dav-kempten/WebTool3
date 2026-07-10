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

import { ToursStore } from '../../../core/stores/tours.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { NamesStore } from '../../../core/stores/names.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import {
  States,
  StatesGroup,
  getStatesOfGroup,
} from '../../../models/value';
import { TourSummary } from '../../../models/tour';
import { toIsoDate } from '../../../shared/util/date';
import { TourCreateDialog } from '../../../shared/dialogs/tour-create-dialog/tour-create-dialog';

interface TourRow extends TourSummary {
  stateName: string;
}

@Component({
  selector: 'avk-tour-list',
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
    TourCreateDialog,
  ],
  templateUrl: './tour-list.html',
  styleUrl: './tour-list.scss',
})
export class TourList implements OnInit {
  private tours = inject(ToursStore);
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
    { label: 'Jugend', value: 'youth' },
  ];

  readonly stateGroupOptions = [
    { label: 'Aktive Touren', value: StatesGroup.Active },
    { label: 'Alle Touren', value: StatesGroup.All },
    { label: 'Fertige Touren', value: StatesGroup.Finished },
  ];

  private readonly permission = this.auth.permission;

  readonly canAdd = computed(
    () => this.permission().permissionLevel >= PermissionLevel.coordinator,
  );

  readonly rows = computed<TourRow[]>(() => {
    const part = this.part();
    const group = getStatesOfGroup(this.stateGroup());
    const stateMap = this.values.stateById();
    const nameMap = this.names.nameById();
    const perm = this.permission();

    return this.tours
      .summaries()
      .filter(
        (t) =>
          (part === 'winter' && t.winter) ||
          (part === 'summer' && t.summer) ||
          (part === 'youth' && t.youthOnTour) ||
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

  // --- create dialog (shared component) ---
  readonly showCreate = signal(false);

  // --- clone dialog ---
  readonly showClone = signal(false);
  readonly cloneForm = this.fb.group({
    tourId: this.fb.control<number | null>(null),
    startDate: this.fb.control<Date | null>(null),
    endDate: this.fb.control<Date | null>(null),
  });

  ngOnInit(): void {
    this.tours.loadSummaries();
    this.values.loadValues();
    this.names.loadNames();
  }

  setPart(value: string | null): void {
    void this.router.navigate(['/tours'], { fragment: value ?? undefined });
  }

  canModify(tour: TourSummary): boolean {
    const perm = this.permission();
    return (
      perm.permissionLevel >= PermissionLevel.coordinator ||
      perm.guideId === tour.guideId
    );
  }

  canDelete(tour: TourSummary): boolean {
    return (
      this.permission().permissionLevel >= PermissionLevel.coordinator &&
      !getStatesOfGroup(StatesGroup.Finished).includes(tour.stateId as States)
    );
  }

  selectTour(tour: TourSummary): void {
    if (this.canModify(tour)) {
      void this.router.navigate(['/tours', tour.id]);
    }
  }

  openClone(tour: TourSummary): void {
    this.cloneForm.reset();
    this.cloneForm.patchValue({ tourId: tour.id });
    this.showClone.set(true);
  }

  clone(): void {
    const value = this.cloneForm.getRawValue();
    if (!value.tourId || !value.startDate) {
      return;
    }
    this.tours.cloneById({
      id: value.tourId,
      startDate: toIsoDate(value.startDate)!,
      endDate: toIsoDate(value.endDate),
    });
    this.showClone.set(false);
  }

  confirmDelete(tour: TourSummary): void {
    this.confirm.confirm({
      header: 'Touraktion',
      message: `Tour ${tour.reference} endgültig löschen?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Tour löschen',
      rejectLabel: 'Abbrechen',
      accept: () => this.tours.remove(tour.id),
    });
  }
}
