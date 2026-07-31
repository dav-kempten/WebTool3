import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';

import { GuidesStore } from '../../../core/stores/guides.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { GuideSummary } from '../../../models/guide';

@Component({
  selector: 'avk-guide-list',
  standalone: true,
  imports: [RouterModule, TableModule, InputTextModule],
  templateUrl: './guide-list.html',
  styleUrl: '../../../shared/styles/list-page.scss',
})
export class GuideList implements OnInit {
  private guides = inject(GuidesStore);
  private auth = inject(AuthService);
  private router = inject(Router);

  private readonly permission = this.auth.permission;

  readonly rows = computed<GuideSummary[]>(() => {
    const perm = this.permission();
    return this.guides
      .summaries()
      .filter((g) =>
        perm.permissionLevel === PermissionLevel.guide ? g.id === perm.guideId : true,
      );
  });

  ngOnInit(): void {
    this.guides.loadSummaries();
  }

  canOpen(guide: GuideSummary): boolean {
    const perm = this.permission();
    return (
      perm.permissionLevel >= PermissionLevel.coordinator || perm.guideId === guide.id
    );
  }

  select(guide: GuideSummary): void {
    if (this.canOpen(guide)) {
      void this.router.navigate(['/trainers', guide.id]);
    }
  }
}
