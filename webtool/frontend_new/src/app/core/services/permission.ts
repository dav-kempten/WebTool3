export const enum Role {
  administrator = 'Administrator',
  staff = 'Geschäftsstelle',
  coordinator = 'Fachbereichssprecher',
  guide = 'Trainer',
}

export const enum PermissionLevel {
  unknown = 0,
  guide = 1,
  coordinator = 2,
  staff = 3,
  administrator = 4,
}

export interface Permission {
  permissionLevel: PermissionLevel;
  guideId: number | undefined;
}

export const ANONYMOUS_PERMISSION: Permission = {
  permissionLevel: PermissionLevel.unknown,
  guideId: undefined,
};

/** Maps the backend role label onto a comparable permission level. */
export function convertRole(role: Role | string | undefined): PermissionLevel {
  switch (role) {
    case Role.administrator:
      return PermissionLevel.administrator;
    case Role.staff:
      return PermissionLevel.staff;
    case Role.coordinator:
      return PermissionLevel.coordinator;
    case Role.guide:
      return PermissionLevel.guide;
    default:
      return PermissionLevel.unknown;
  }
}

/** Maps the raw backend role key (e.g. "guide") onto the German role label. */
export function roleFromKey(key: string | undefined): Role | undefined {
  switch (key) {
    case 'guide':
      return Role.guide;
    case 'staff':
      return Role.staff;
    case 'coordinator':
      return Role.coordinator;
    case 'administrator':
      return Role.administrator;
    default:
      return undefined;
  }
}
