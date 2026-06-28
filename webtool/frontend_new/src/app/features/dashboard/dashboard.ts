import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/services/auth.service';

interface DashboardTile {
  label: string;
  icon: string;
  link: string;
  description: string;
}

@Component({
  selector: 'avk-dashboard',
  standalone: true,
  imports: [RouterModule, CardModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private auth = inject(AuthService);
  readonly user = this.auth.user;
  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly tiles: DashboardTile[] = [
    {
      label: 'Touren',
      icon: 'pi pi-globe',
      link: '/tours',
      description: 'Gemeinschaftstouren planen und verwalten.',
    },
    {
      label: 'Kurse',
      icon: 'pi pi-comments',
      link: '/instructions',
      description: 'Aus- und Fortbildungen organisieren.',
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
      description: 'Vorträge und Veranstaltungen ankündigen.',
    },
  ];
}
