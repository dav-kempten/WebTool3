import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';
import { RawUser } from '../../models/user';

export type LoginKind = 'member' | 'staff';

const KIND_KEY = 'avk-login-kind';

/**
 * Turns what people type into the stored form "008-00-123456": the DAV card
 * prints "008/00/123456", and stray spaces come with copy and paste.
 */
export function normalizeMemberId(value: string): string {
  return value.trim().replace(/\s+/g, '').replace(/\//g, '-');
}

/** Only paths inside the app, so a crafted link cannot send users elsewhere. */
export function safeReturnUrl(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login')
    ? value
    : '/dashboard';
}

/**
 * The login page: the only page without a login. Trainers sign in with their
 * member number, the office with user name and password; both land on the
 * dashboard (or where they wanted to go before).
 */
@Component({
  selector: 'avk-login',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    SelectButtonModule,
    MessageModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  readonly kinds: { label: string; value: LoginKind }[] = [
    { label: 'Trainer', value: 'member' },
    { label: 'Geschäftsstelle', value: 'staff' },
  ];
  readonly kind = signal<LoginKind>(this.restoreKind());
  readonly failed = signal(false);
  readonly busy = signal(false);
  /** Should the logo (public/dav-kempten.jpg, a copy of the admin's webtool/static logo) fail to load, the name stands in. */
  readonly logoMissing = signal(false);

  readonly memberForm = this.fb.nonNullable.group({
    memberId: ['', Validators.required],
  });
  readonly staffForm = this.fb.nonNullable.group({
    userName: ['', Validators.required],
    password: ['', Validators.required],
  });

  setKind(kind: LoginKind | null): void {
    if (!kind) {
      return;
    }
    this.kind.set(kind);
    this.failed.set(false);
    try {
      localStorage.setItem(KIND_KEY, kind);
    } catch {
      /* storage unavailable — the choice just isn't remembered */
    }
  }

  submit(): void {
    if (this.busy()) {
      return;
    }
    let request;
    if (this.kind() === 'member') {
      const memberId = normalizeMemberId(this.memberForm.getRawValue().memberId);
      if (!memberId) {
        return;
      }
      request = this.auth.login('', '', memberId);
    } else {
      const { userName, password } = this.staffForm.getRawValue();
      if (!userName || !password) {
        return;
      }
      request = this.auth.login(userName.trim(), password, '');
    }
    this.busy.set(true);
    this.failed.set(false);
    request.subscribe((user: RawUser) => {
      this.busy.set(false);
      if (user && user.id !== undefined) {
        void this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')));
      } else {
        this.failed.set(true);
        this.staffForm.controls.password.reset();
      }
    });
  }

  private restoreKind(): LoginKind {
    try {
      return localStorage.getItem(KIND_KEY) === 'staff' ? 'staff' : 'member';
    } catch {
      return 'member';
    }
  }
}
