import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../services/auth.service';
import { BreadcrumbBar } from '../breadcrumb-bar/breadcrumb-bar';

/**
 * Navigation and, on the right, who is logged in and as what. Logging in
 * happens on the login page (features/login), which shows no menu.
 */
@Component({
  selector: 'avk-main-menu',
  standalone: true,
  imports: [RouterModule, MenubarModule, SplitButtonModule, ButtonModule, TooltipModule, BreadcrumbBar],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.scss',
})
export class MainMenu {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly user = this.auth.user;
  readonly isLoggedIn = this.auth.isLoggedIn;
  /** "Trainer", "Geschäftsstelle" or "Administrator" — the role's German label. */
  readonly roleLabel = computed(() => this.user().role ?? '');

  readonly navItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
    {
      label: 'Kurse',
      icon: 'pi pi-comments',
      routerLink: '/instructions',
      items: [
        { label: 'Winter', routerLink: '/instructions', fragment: 'winter' },
        { label: 'Sommer', routerLink: '/instructions', fragment: 'summer' },
        { label: 'Indoor', routerLink: '/instructions', fragment: 'indoor' },
      ],
    },
    {
      label: 'Touren',
      icon: 'pi pi-globe',
      routerLink: '/tours',
      items: [
        { label: 'Winter', routerLink: '/tours', fragment: 'winter' },
        { label: 'Sommer', routerLink: '/tours', fragment: 'summer' },
        { label: 'Jugend', routerLink: '/tours', fragment: 'youth' },
      ],
    },
    { label: 'Gruppen', icon: 'pi pi-users', routerLink: '/sessions' },
    { label: 'Events', icon: 'pi pi-bookmark', routerLink: '/talks' },
    { label: 'Trainer', icon: 'pi pi-id-card', routerLink: '/trainers' },
  ];

  readonly userMenu: MenuItem[] = [
    {
      label: 'Mein Profil',
      icon: 'pi pi-user',
      command: () => {
        const id = this.user().id;
        if (id) {
          void this.router.navigate(['/trainers', id]);
        }
      },
    },
  ];

  logout(): void {
    this.auth.logout(() => void this.router.navigate(['/login']));
  }
}
