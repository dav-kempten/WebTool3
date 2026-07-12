import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/services/auth.service';
import { PermissionLevel } from '../../core/services/permission';
import { TourCreateDialog } from '../../shared/dialogs/tour-create-dialog/tour-create-dialog';
import { InstructionCreateDialog } from '../../shared/dialogs/instruction-create-dialog/instruction-create-dialog';

interface DashboardTile {
  label: string;
  icon: string;
  link: string;
  description: string;
}

@Component({
  selector: 'avk-dashboard',
  standalone: true,
  imports: [RouterModule, CardModule, TourCreateDialog, InstructionCreateDialog],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private auth = inject(AuthService);
  readonly user = this.auth.user;
  readonly isLoggedIn = this.auth.isLoggedIn;

  /** Guides may create too — the new event is then assigned to them. */
  readonly canCreate = computed(
    () => this.auth.permission().permissionLevel >= PermissionLevel.guide,
  );

  readonly showCreateTour = signal(false);
  readonly showCreateInstruction = signal(false);

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
