import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { RawUser } from '../../models/user';
import {
  ANONYMOUS_PERMISSION,
  Permission,
  Role,
  PermissionLevel,
  convertRole,
  roleFromKey,
} from './permission';

export interface User {
  id: number | undefined;
  firstName: string;
  lastName: string;
  role: Role | undefined;
}

export const ANONYMOUS_USER: User = {
  id: undefined,
  firstName: '',
  lastName: '',
  role: undefined,
};

const STORAGE_KEY = 'avk-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private readonly userSignal = signal<User>(this.restore());

  /** Reactive view of the currently authenticated user. */
  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal().id);
  readonly isLoggedOut = computed(() => !this.isLoggedIn());
  readonly guideId = computed(() => this.userSignal().id);

  /** Permission level + guide id derived from the current user's role. */
  readonly permission = computed<Permission>(() => {
    const user = this.userSignal();
    if (!user.id) {
      return ANONYMOUS_PERMISSION;
    }
    return { permissionLevel: convertRole(user.role), guideId: user.id };
  });

  /*
   * Die Rechteprüfungen der Seiten — hier an einer Stelle, damit "Staff" nicht
   * auf der einen Seite die Geschäftsstelle und auf der anderen schon die
   * Fachbereichssprecher meint. Jede Stufe schließt die höheren ein.
   */

  /** Genau Trainer, ohne weitergehende Rechte: sieht nur die eigenen Touren und Kurse. */
  readonly isGuideOnly = computed(() => this.permission().permissionLevel === PermissionLevel.guide);

  /** Ab Trainer: alle, die mit dem Tool arbeiten (Anlegen, Support, eigene Termine). */
  readonly isGuideOrAbove = computed(() => this.permission().permissionLevel >= PermissionLevel.guide);

  /** Ab Fachbereichssprecher: sieht und bearbeitet alle Touren, Kurse, Gruppen und Trainer. */
  readonly isCoordinatorOrAbove = computed(
    () => this.permission().permissionLevel >= PermissionLevel.coordinator,
  );

  /** Ab Geschäftsstelle: TN-Gebühr, KV-Verlinkung, Homepage-Hinweise. */
  readonly isOfficeOrAbove = computed(() => this.permission().permissionLevel >= PermissionLevel.staff);

  /**
   * Resolves once the server has said who owns the session cookie (or that the
   * request failed). Until then a new tab looks anonymous although the cookie
   * may be valid, so the route guards wait for it before sending to /login.
   */
  readonly ready: Promise<void>;
  private markReady: () => void = () => undefined;
  /** True once `ready` has resolved, for synchronous checks. */
  readonly checked = signal(false);

  constructor() {
    this.ready = new Promise<void>((resolve) => {
      this.markReady = () => {
        this.checked.set(true);
        resolve();
      };
    });
    this.refresh();
  }

  /**
   * Asks the server who owns the session cookie. sessionStorage is per tab, so
   * a newly opened tab starts out anonymous although the cookie is valid; this
   * picks the login up, and it also notices a session that expired meanwhile.
   * On a network or server error the current state is kept.
   */
  refresh(): void {
    this.http.get<RawUser>('/api/login/').subscribe({
      next: (rawUser) => {
        this.setUser(rawUser && rawUser.id ? convertUser(rawUser) : ANONYMOUS_USER);
        this.markReady();
      },
      error: () => {
        /* keep what sessionStorage restored */
        this.markReady();
      },
    });
  }

  login(username = '', password = '', memberId = '') {
    return this.http
      .post<RawUser>('/api/login/', {
        member_id: memberId,
        username,
        password,
      })
      .pipe(
        catchError(() => of({} as RawUser)),
        tap((rawUser) => {
          if (rawUser && Object.keys(rawUser).length) {
            this.setUser(convertUser(rawUser));
          } else {
            this.setUser(ANONYMOUS_USER);
          }
        }),
      );
  }

  /** `done` runs once the server has ended the session (or the request failed). */
  logout(done?: () => void): void {
    this.http.post<void>('/api/logout/', {}).subscribe({
      next: () => {
        this.setUser(ANONYMOUS_USER);
        done?.();
      },
      error: () => {
        this.setUser(ANONYMOUS_USER);
        done?.();
      },
    });
  }

  private setUser(user: User): void {
    this.userSignal.set(user);
    try {
      if (user.id) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* sessionStorage unavailable — keep the in-memory signal only. */
    }
  }

  private restore(): User {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return ANONYMOUS_USER;
      }
      const user = JSON.parse(raw) as User;
      if (user && user.id) {
        return user;
      }
    } catch {
      /* ignore malformed persisted state */
    }
    return ANONYMOUS_USER;
  }
}

function convertUser(user: RawUser): User {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: roleFromKey(user.role),
  };
}

export { Role, PermissionLevel };
export type { Permission };
