import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { GuideDetail } from './guide-detail';
import { GuideService } from '../../../core/services/guide.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permission, PermissionLevel } from '../../../core/services/permission';
import { Guide, GuideProfile } from '../../../models/guide';

const SAMPLE_GUIDE: Guide = {
  id: 42,
  firstName: 'Anna',
  lastName: 'Alpin',
  userName: 'anna',
  profile: {
    name: 'Anni',
    city: 'Kempten',
    job: 'Tourenleiterin',
    hobby: 'Klettern',
    reason: 'Freude an den Bergen',
    tip: 'Reuterwanne',
  },
};

function setup(options: {
  routeId?: string;
  permission: Permission;
  guide?: Guide | null;
}) {
  const saved: Array<{ id: number; profile: GuideProfile }> = [];
  let getCalls = 0;

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      MessageService,
      {
        provide: AuthService,
        useValue: {
          permission: signal(options.permission).asReadonly(),
          isLoggedIn: signal(options.permission.guideId != null).asReadonly(),
          isOfficeOrAbove: signal(
            options.permission.permissionLevel >= PermissionLevel.staff,
          ).asReadonly(),
        },
      },
      {
        provide: GuideService,
        useValue: {
          getGuideSummaries: () => of([]),
          getGuide: (id: number) => {
            getCalls++;
            return of(options.guide === undefined ? SAMPLE_GUIDE : options.guide);
          },
          updateGuide: (id: number, profile: GuideProfile) => {
            saved.push({ id, profile });
            return of({
              data: { ...SAMPLE_GUIDE, id, profile },
              errors: [],
            });
          },
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(GuideDetail);
  fixture.componentRef.setInput('id', options.routeId ?? '42');
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    saved,
    getCalls: () => getCalls,
  };
}

describe('GuideDetail', () => {
  it('loads and saves a trainer’s own Steckbrief', () => {
    const { component, saved, fixture } = setup({
      permission: { permissionLevel: PermissionLevel.guide, guideId: 42 },
    });

    expect(component.canView()).toBe(true);
    expect(component.canEdit()).toBe(true);

    const fg = component.form();
    expect(fg).toBeDefined();
    expect(fg!.getRawValue()).toEqual(SAMPLE_GUIDE.profile);

    fg!.patchValue({ city: 'Sonthofen', tip: 'Grünten' });
    fg!.markAsDirty();
    component.save();
    fixture.detectChanges();

    expect(saved).toEqual([
      {
        id: 42,
        profile: {
          ...SAMPLE_GUIDE.profile,
          city: 'Sonthofen',
          tip: 'Grünten',
        },
      },
    ]);
    expect(fg!.pristine).toBe(true);
  });

  it('blocks a trainer from viewing another trainer’s profile', () => {
    const { component, getCalls } = setup({
      routeId: '42',
      permission: { permissionLevel: PermissionLevel.guide, guideId: 99 },
    });

    expect(component.canView()).toBe(false);
    expect(component.canEdit()).toBe(false);
    expect(getCalls()).toBe(0);
  });

  it('allows staff to view and edit any trainer’s profile', () => {
    const { component, saved } = setup({
      routeId: '42',
      permission: { permissionLevel: PermissionLevel.staff, guideId: 1 },
    });

    expect(component.canView()).toBe(true);
    expect(component.canEdit()).toBe(true);

    component.form()!.patchValue({ job: 'Ausbildungsreferentin' });
    component.save();

    expect(saved.length).toBe(1);
    expect(saved[0].profile.job).toBe('Ausbildungsreferentin');
  });

  it('shows not-found state when the user has no Guide record', () => {
    const { component } = setup({
      routeId: '7',
      permission: { permissionLevel: PermissionLevel.staff, guideId: 7 },
      guide: null,
    });

    expect(component.isNotFound()).toBe(true);
    expect(component.form()).toBeUndefined();
  });
});
