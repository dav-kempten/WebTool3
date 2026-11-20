import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService } from 'primeng/api';

import { SessionsStore } from '../../../core/stores/sessions.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { NamesStore } from '../../../core/stores/names.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { States, StatesGroup, getStatesOfGroup } from '../../../models/value';
import { SessionSummary } from '../../../models/session';
import {
  SessionCreateDialog,
  creatableCollectives,
} from '../../../shared/dialogs/session-create-dialog/session-create-dialog';

interface SessionRow extends SessionSummary {
  stateName: string;
  /** Guide name; falls back to the external speaker if no guide is set. */
  leader: string;
}

@Component({
  selector: 'avk-session-list',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SessionCreateDialog,
  ],
  templateUrl: './session-list.html',
  styleUrl: '../../../shared/styles/list-page.scss',
})
export class SessionList implements OnInit {
  private sessions = inject(SessionsStore);
  private values = inject(ValuesStore);
  private names = inject(NamesStore);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmationService);

  readonly part = toSignal(this.route.fragment, { initialValue: null });
  readonly stateGroup = signal<StatesGroup>(StatesGroup.Active);

  readonly partOptions = [
    { label: 'Alle', value: null },
    { label: 'Jungmannschaft', value: 'gjm' },
    { label: 'Bergwandern', value: 'gbw' },
    { label: 'Obergünzburg', value: 'obg' },
    { label: 'HiKE', value: 'hkw' },
    { label: 'Abendschule', value: 'aas' },
    { label: 'Vollmond', value: 'vst' },
  ];

  readonly stateGroupOptions = [
    { label: 'Aktive Termine', value: StatesGroup.Active },
    { label: 'Alle Termine', value: StatesGroup.All },
    { label: 'Fertige Termine', value: StatesGroup.Ready },
  ];

  private readonly permission = this.auth.permission;

  /** Collectives the current user manages. */
  readonly managedCollectives = computed(() => {
    const guideId = this.permission().guideId;
    return this.values.collectives().filter((c) => c.managers.includes(guideId ?? -1));
  });
  readonly isStaff = computed(
    () => this.permission().permissionLevel >= PermissionLevel.coordinator,
  );
  readonly canAdd = computed(
    () => creatableCollectives(this.values.collectives(), this.permission()).length > 0,
  );

  readonly rows = computed<SessionRow[]>(() => {
    const part = this.part();
    const group = getStatesOfGroup(this.stateGroup());
    const stateMap = this.values.stateById();
    const nameMap = this.names.nameById();

    return this.sessions
      .summaries()
      .filter((s) => !part || s.reference.slice(0, 3).toLowerCase() === part)
      .filter((s) => group.includes(s.stateId))
      .map((s) => {
        const name = nameMap.get(s.guideId);
        return {
          ...s,
          stateName: stateMap.get(s.stateId)?.state ?? '',
          leader: name ? `${name.firstName} ${name.lastName}` : (s.speaker ?? ''),
        };
      });
  });

  readonly showCreate = signal(false);

  ngOnInit(): void {
    // ensureSummaries: a hard reload here would overwrite locally synced,
    // not-yet-saved detail edits; every save refreshes the summaries anyway.
    this.sessions.ensureSummaries();
    this.values.loadValues();
    this.names.loadNames();
  }

  setPart(value: string | null): void {
    void this.router.navigate(['/sessions'], { fragment: value ?? undefined });
  }

  canModify(row: SessionSummary): boolean {
    return (
      this.isStaff() ||
      this.managedCollectives().some((c) => c.id === row.collectiveId)
    );
  }

  canDelete(row: SessionSummary): boolean {
    return (
      this.isStaff() &&
      !getStatesOfGroup(StatesGroup.Finished).includes(row.stateId as States)
    );
  }

  select(row: SessionSummary): void {
    if (this.canModify(row)) {
      void this.router.navigate(['/sessions', row.id]);
    }
  }

  openCreate(): void {
    this.showCreate.set(true);
  }

  cloneRow(row: SessionSummary): void {
    this.sessions.cloneById(row.id);
  }

  confirmDelete(row: SessionSummary): void {
    this.confirm.confirm({
      header: 'Gruppentermin',
      message: `Termin ${row.reference} endgültig löschen?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Löschen',
      rejectLabel: 'Abbrechen',
      accept: () => this.sessions.remove(row.id),
    });
  }
}