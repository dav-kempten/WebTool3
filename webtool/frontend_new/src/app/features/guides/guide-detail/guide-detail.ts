import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

import { GuidesStore } from '../../../core/stores/guides.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';

@Component({
  selector: 'avk-guide-detail',
  standalone: true,
  imports: [RouterModule, CardModule, ButtonModule],
  templateUrl: './guide-detail.html',
})
export class GuideDetail {
  readonly id = input.required<string>();

  private guides = inject(GuidesStore);
  private auth = inject(AuthService);

  private readonly guideId = computed(() => Number(this.id()));
  readonly guide = computed(() => this.guides.guideById()[this.guideId()]);

  private readonly permission = this.auth.permission;
  readonly canView = computed(() => {
    const perm = this.permission();
    return (
      perm.permissionLevel >= PermissionLevel.coordinator ||
      perm.guideId === this.guideId()
    );
  });

  constructor() {
    effect(() => {
      const id = this.guideId();
      if (id && !this.guide()) {
        this.guides.loadGuide(id);
      }
    });
  }
}
