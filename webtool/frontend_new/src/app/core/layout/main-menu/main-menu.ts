import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RawUser } from '../../../models/user';
import { AuthService } from '../../services/auth.service';
import { BreadcrumbBar } from '../breadcrumb-bar/breadcrumb-bar';

@Component({
  selector: 'avk-main-menu',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MenubarModule,
    SplitButtonModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    BreadcrumbBar,
  ],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.scss',
})
export class MainMenu {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly user = this.auth.user;
  readonly isLoggedIn = this.auth.isLoggedIn;

  readonly displayMemberLogin = signal(false);
  readonly displayStaffLogin = signal(false);
  readonly memberError = signal(false);
  readonly staffError = signal(false);

  readonly memberForm = this.fb.nonNullable.group({
    memberId: ['', Validators.required],
  });
  readonly staffForm = this.fb.nonNullable.group({
    userName: ['', Validators.required],
    password: ['', Validators.required],
  });

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

  readonly loginMenu: MenuItem[] = [
    {
      label: 'Service Zugang',
      icon: 'pi pi-lock',
      command: () => this.displayStaffLogin.set(true),
    },
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

  loginLabel(): string {
    return this.isLoggedIn() ? 'Abmelden' : 'Anmelden';
  }

  loginButtonHandler(): void {
    if (this.isLoggedIn()) {
      this.auth.logout();
      void this.router.navigate(['/dashboard']);
    } else {
      this.displayMemberLogin.set(true);
    }
  }

  loginMember(): void {
    const memberId = this.memberForm.getRawValue().memberId;
    if (!memberId) {
      return;
    }
    this.auth.login('', '', memberId).subscribe((user) => this.afterLogin(user, 'member'));
  }

  loginStaff(): void {
    const { userName, password } = this.staffForm.getRawValue();
    if (!userName || !password) {
      return;
    }
    this.auth.login(userName, password, '').subscribe((user) => this.afterLogin(user, 'staff'));
  }

  private afterLogin(user: RawUser, kind: 'member' | 'staff'): void {
    const ok = !!user && Object.keys(user).length > 0 && user.id !== undefined;
    if (kind === 'member') {
      this.memberError.set(!ok);
      if (ok) {
        this.displayMemberLogin.set(false);
        this.memberForm.reset();
      }
    } else {
      this.staffError.set(!ok);
      if (ok) {
        this.displayStaffLogin.set(false);
        this.staffForm.reset();
      }
    }
  }
}
