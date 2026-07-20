import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/services/auth.service';
import { PermissionLevel } from '../../core/services/permission';
import { ToursStore } from '../../core/stores/tours.store';
import { InstructionsStore } from '../../core/stores/instructions.store';
import { ValuesStore } from '../../core/stores/values.store';
import { StatesGroup, getStatesOfGroup } from '../../models/value';
import { TourCreateDialog } from '../../shared/dialogs/tour-create-dialog/tour-create-dialog';
import { InstructionCreateDialog } from '../../shared/dialogs/instruction-create-dialog/instruction-create-dialog';

interface DashboardTile {
  label: string;
  icon: string;
  link: string;
  description: string;
}

interface MyEventRow {
  id: number;
  reference: string;
  title: string;
  startDate: string;
  stateName: string;
}

/**
 * States a guide cares about on the dashboard — all active ones (everything
 * except Durchgeführt and Ausgefallen), matching the lists' "Aktive" filter.
 */
const MY_EVENT_STATES: number[] = getStatesOfGroup(StatesGroup.Active);

@Component({
  selector: 'avk-dashboard',
  standalone: true,
  imports: [RouterModule, DatePipe, CardModule, TourCreateDialog, InstructionCreateDialog],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private auth = inject(AuthService);
  private tours = inject(ToursStore);
  private instructions = inject(InstructionsStore);
  private values = inject(ValuesStore);

  readonly user = this.auth.user;
  readonly isLoggedIn = this.auth.isLoggedIn;

  /** Guides may create too — the new event is then assigned to them. */
  readonly canCreate = computed(
    () => this.auth.permission().permissionLevel >= PermissionLevel.guide,
  );

  readonly showCreateTour = signal(false);
  readonly showCreateInstruction = signal(false);

  private readonly guideId = computed(() => this.auth.permission().guideId);
  /**
   * Own-events lists are for users who lead tours/courses themselves (guides,
   * coordinators). Staff/admins only manage and approve — no lists for them.
   */
  readonly showMyEvents = computed(() => {
    const perm = this.auth.permission();
    return perm.guideId != null && perm.permissionLevel < PermissionLevel.staff;
  });

  readonly myTours = computed<MyEventRow[]>(() =>
    this.toRows(this.tours.summaries()),
  );
  readonly myInstructions = computed<MyEventRow[]>(() =>
    this.toRows(this.instructions.summaries()),
  );

  private toRows(
    summaries: Array<{
      id: number;
      reference: string;
      title: string;
      startDate: string;
      guideId: number;
      stateId: number;
    }>,
  ): MyEventRow[] {
    const guideId = this.guideId();
    if (guideId == null) {
      return [];
    }
    const stateMap = this.values.stateById();
    return summaries
      .filter((s) => s.guideId === guideId && MY_EVENT_STATES.includes(s.stateId))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((s) => ({
        id: s.id,
        reference: s.reference,
        title: s.title,
        startDate: s.startDate,
        stateName: stateMap.get(s.stateId)?.state ?? '',
      }));
  }

  constructor() {
    // The dashboard is mounted once at app start, before login — a one-shot
    // ngOnInit check ran too early (permission()/guideId still anonymous) and
    // never re-ran once the login dialog resolved. React to the signal instead
    // so the lists appear as soon as showMyEvents() flips to true post-login.
    effect(() => {
      if (this.showMyEvents()) {
        this.values.loadValues();
        this.tours.ensureSummaries();
        this.instructions.ensureSummaries();
      }
    });
  }

  readonly tiles: DashboardTile[] = [
    {
      label: 'Touren',
      icon: 'pi pi-globe',
      link: '/tours',
      description: 'Gemeinschaftstouren einsehen und ändern.',
    },
    {
      label: 'Kurse',
      icon: 'pi pi-graduation-cap',
      link: '/instructions',
      description: 'Aus- und Fortbildungen verwalten.',
    },
    {
      label: 'Gruppen',
      icon: 'pi pi-users',
      link: '/sessions',
      description: 'Gruppentermine und Treffen koordinieren.',
    },
    {
      label: 'Events',
      icon: 'pi pi-bookmark',
      link: '/talks',
      description: '[Im Aufbau] Vorträge und Veranstaltungen ankündigen.',
    },
  ];
}
