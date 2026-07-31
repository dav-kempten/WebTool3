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
  readonly isAdministrator = computed(() => this.userSignal().role === Role.administrator);
  readonly isStaff = computed(() => this.userSignal().role === Role.staff);
  readonly isCoordinator = computed(() => this.userSignal().role === Role.coordinator);
  readonly isGuide = computed(() => this.userSignal().role === Role.guide);
  readonly guideId = computed(() => this.userSignal().id);

  /** Permission level + guide id derived from the current user's role. */
  readonly permission = computed<Permission>(() => {
    const user = this.userSignal();
    if (!user.id) {
      return ANONYMOUS_PERMISSION;
    }
    return { permissionLevel: convertRole(user.role), guideId: user.id };
  });

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

  logout(): void {
    this.http.post<void>('/api/logout/', {}).subscribe({
      next: () => this.setUser(ANONYMOUS_USER),
      error: () => this.setUser(ANONYMOUS_USER),
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
