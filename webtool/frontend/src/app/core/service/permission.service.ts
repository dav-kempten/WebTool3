import {Injectable, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {ANONYMOUS_USER, AuthService, Role, User} from './auth.service';
import {filter, map, publishReplay, refCount, takeUntil, tap} from 'rxjs/operators';

export const enum PermissionLevel {
  unknown = 0,
  guide = 1,
  coordinator = 2,
  staff = 3,
  administrator = 4
}

export interface Permission {
  permissionLevel: PermissionLevel;
  guideId: number;
}

export const ANONYMOUS_PERMISSION = {
  permissionLevel: PermissionLevel.unknown,
  guideId: undefined
};

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor() { }

  convertRole(role: Role): PermissionLevel {
    switch (role) {
      case Role.administrator: return PermissionLevel.administrator;
      case Role.staff: return PermissionLevel.staff;
      case Role.coordinator: return PermissionLevel.coordinator;
      case Role.guide: return PermissionLevel.guide;
      default: return PermissionLevel.unknown;
    }
  }
}
