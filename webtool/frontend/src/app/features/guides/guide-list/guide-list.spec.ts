import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { GuideList } from './guide-list';
import { GuideService } from '../../../core/services/guide.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permission, PermissionLevel } from '../../../core/services/permission';
import { GuideSummary } from '../../../models/guide';

const SUMMARIES: GuideSummary[] = [
  {
    id: 10,
    firstName: 'Anna',
    lastName: 'Alpin',
    userName: 'anna',
    job: 'Tourenleiterin',
    hasProfile: true,
  },
  {
    id: 20,
    firstName: 'Ben',
    lastName: 'Berg',
    userName: 'ben',
    job: '',
    hasProfile: false,
  },
];

function setup(permission: Permission) {
  let summaryCalls = 0;

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      MessageService,
      {
        provide: AuthService,
        useValue: {
          permission: signal(permission).asReadonly(),
          isLoggedIn: signal(permission.guideId != null).asReadonly(),
          isOfficeOrAbove: signal(
            permission.permissionLevel >= PermissionLevel.staff,
          ).asReadonly(),
        },
      },
      {
        provide: GuideService,
        useValue: {
          getGuideSummaries: () => {
            summaryCalls++;
            return of(SUMMARIES);
          },
          getGuide: () => of(null),
        },
      },
    ],
  });

  const router = TestBed.inject(Router);
  const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

  const fixture = TestBed.createComponent(GuideList);
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    navigateSpy,
    summaryCalls: () => summaryCalls,
  };
}

describe('GuideList', () => {
  it('shows all trainers to staff, filters by Steckbrief status, and navigates on select', () => {
    const { component, navigateSpy, summaryCalls } = setup({
      permissionLevel: PermissionLevel.staff,
      guideId: 1,
    });

    expect(component.isOffice()).toBe(true);
    expect(summaryCalls()).toBe(1);
    expect(component.rows().map((r) => r.id)).toEqual([10, 20]);

    component.profileFilter.set('with');
    expect(component.rows().map((r) => r.id)).toEqual([10]);

    component.profileFilter.set('without');
    expect(component.rows().map((r) => r.id)).toEqual([20]);

    component.select(SUMMARIES[0]);
    expect(navigateSpy).toHaveBeenCalledWith(['/trainers', 10]);
  });

  it('also grants full access to administrators', () => {
    const { component, summaryCalls } = setup({
      permissionLevel: PermissionLevel.administrator,
      guideId: 2,
    });

    expect(component.isOffice()).toBe(true);
    expect(summaryCalls()).toBe(1);
    expect(component.rows().length).toBe(2);
  });

  it('blocks normal trainers from loading the full trainer list', () => {
    const { component, navigateSpy, summaryCalls } = setup({
      permissionLevel: PermissionLevel.guide,
      guideId: 10,
    });

    expect(component.isOffice()).toBe(false);
    expect(summaryCalls()).toBe(0);
    expect(component.rows()).toEqual([]);
    expect(component.myId()).toBe(10);

    component.select(SUMMARIES[1]);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
