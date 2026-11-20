import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { GuidesStore } from '../../../core/stores/guides.store';
import { AuthService } from '../../../core/services/auth.service';
import { GuideSummary } from '../../../models/guide';

export type ProfileFilter = 'all' | 'with' | 'without';

@Component({
  selector: 'avk-guide-list',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    ButtonModule,
    CardModule,
    TagModule,
  ],
  templateUrl: './guide-list.html',
  styleUrl: '../../../shared/styles/list-page.scss',
})
export class GuideList {
  private guides = inject(GuidesStore);
  private auth = inject(AuthService);
  private router = inject(Router);

  /** Geschäftsstelle und Admins sehen und bearbeiten alle Trainer-Steckbriefe. */
  readonly isOffice = this.auth.isOfficeOrAbove;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly myId = computed(() => this.auth.permission().guideId);

  readonly profileFilter = signal<ProfileFilter>('all');
  readonly profileFilterOptions: Array<{ label: string; value: ProfileFilter }> = [
    { label: 'Alle Trainer', value: 'all' },
    { label: 'Mit Steckbrief', value: 'with' },
    { label: 'Ohne Steckbrief', value: 'without' },
  ];

  readonly rows = computed<GuideSummary[]>(() => {
    if (!this.isOffice()) {
      return [];
    }
    const filter = this.profileFilter();
    return this.guides.summaries().filter((g) => {
      if (filter === 'with') {
        return g.hasProfile;
      }
      if (filter === 'without') {
        return !g.hasProfile;
      }
      return true;
    });
  });

  constructor() {
    effect(() => {
      if (this.isOffice()) {
        untracked(() => this.guides.ensureSummaries());
      }
    });
  }

  select(guide: GuideSummary): void {
    if (this.isOffice()) {
      void this.router.navigate(['/trainers', guide.id]);
    }
  }
}
