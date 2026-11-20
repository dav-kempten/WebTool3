import { describe, expect, it } from 'vitest';
import { PermissionLevel } from '../../../core/services/permission';
import { Collective } from '../../../models/value';
import { creatableCollectives } from './session-create-dialog';

const hike = { id: 1, title: 'HiKE', managers: [7] } as Collective;
const vollmond = { id: 2, title: 'Vollmond', managers: [8, 9] } as Collective;
const all = [hike, vollmond];

describe('creatableCollectives', () => {
  it('gives a group leader only the groups they manage', () => {
    expect(creatableCollectives(all, { permissionLevel: PermissionLevel.guide, guideId: 9 })).toEqual([vollmond]);
  });

  it('gives a trainer without a group nothing, so the dashboard hides the tile', () => {
    expect(creatableCollectives(all, { permissionLevel: PermissionLevel.guide, guideId: 5 })).toEqual([]);
  });

  it('gives nothing to someone without a guide profile', () => {
    expect(creatableCollectives(all, { permissionLevel: PermissionLevel.unknown, guideId: undefined })).toEqual([]);
  });

  it.each([PermissionLevel.coordinator, PermissionLevel.staff, PermissionLevel.administrator])(
    'gives level %i every group',
    (permissionLevel) => {
      expect(creatableCollectives(all, { permissionLevel, guideId: undefined })).toEqual(all);
    },
  );
});
