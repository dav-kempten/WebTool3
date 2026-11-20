import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService } from 'primeng/api';

import { SessionsStore } from '../../../core/stores/sessions.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { NamesStore } from '../../../core/stores/names.store';
import { AuthService } from '../../../core/services/auth.service';
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

  /**
   * Gruppenfilter aus den Stammdaten: alle Gruppen, die in der Liste Termine
   * haben, dazu die eigenen Gruppen eines Gruppenleiters, alphabetisch. Der Wert ist der Gruppencode in Kleinbuchstaben, so
   * bleiben Links wie /sessions#gjm gültig.
   */
  readonly partOptions = computed(() => {
    const withSessions = new Set(this.sessions.summaries().map((s) => s.collectiveId));
    const managed = new Set(this.managedCollectives().map((c) => c.id));
    return this.values
      .collectives()
      .filter((c) => withSessions.has(c.id) || managed.has(c.id))
      .map((c) => ({ label: c.title, value: c.code.toLowerCase() }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de'));
  });

  private readonly codeByCollectiveId = computed(
    () => new Map(this.values.collectives().map((c) => [c.id, c.code.toLowerCase()])),
  );

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
  /** Fachbereichssprecher und darüber: alle Gruppen, nicht nur die eigenen. */
  readonly isCoordinator = this.auth.isCoordinatorOrAbove;
  readonly canAdd = computed(
    () => creatableCollectives(this.values.collectives(), this.permission()).length > 0,
  );

  /**
   * Ein Gruppenleiter sieht beim Öffnen der Liste gleich seine eigene Gruppe
   * (leitet er mehrere, die alphabetisch erste). Das passiert nur einmal je
   * Aufruf und nur, wenn die Adresse keine Gruppe nennt — wer danach „Alle
   * Gruppen“ wählt, behält das. Fachbereichssprecher und Geschäftsstelle
   * starten wie bisher mit allen Gruppen.
   */
  private ownGroupChecked = false;
  private readonly preselectOwnGroup = effect(() => {
    if (this.ownGroupChecked) {
      return;
    }
    if (this.part() || !this.auth.isGuideOnly()) {
      this.ownGroupChecked = this.auth.isLoggedIn();
      return;
    }
    const own = [...this.managedCollectives()].sort((a, b) => a.title.localeCompare(b.title, 'de'))[0];
    if (!own) {
      return; // Stammdaten noch nicht geladen, oder keine eigene Gruppe
    }
    this.ownGroupChecked = true;
    untracked(() =>
      this.router.navigate(['/sessions'], { fragment: own.code.toLowerCase(), replaceUrl: true }),
    );
  });

  readonly rows = computed<SessionRow[]>(() => {
    const part = this.part();
    const group = getStatesOfGroup(this.stateGroup());
    const stateMap = this.values.stateById();
    const nameMap = this.names.nameById();

    return this.sessions
      .summaries()
      .filter((s) => !part || this.codeByCollectiveId().get(s.collectiveId) === part)
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
      this.isCoordinator() ||
      this.managedCollectives().some((c) => c.id === row.collectiveId)
    );
  }

  canDelete(row: SessionSummary): boolean {
    return (
      this.isCoordinator() &&
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