import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';

import { GuidesStore } from '../../../core/stores/guides.store';
import { AuthService } from '../../../core/services/auth.service';
import { AutoSaveService } from '../../../core/services/auto-save.service';
import { PermissionLevel } from '../../../core/services/permission';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import { EMPTY_GUIDE_PROFILE, Guide, GuideProfile } from '../../../models/guide';
import { describeSaveErrorPath } from '../../../shared/util/save-error';

@Component({
  selector: 'avk-guide-detail',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    DatePipe,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
  ],
  providers: [AutoSaveService],
  templateUrl: './guide-detail.html',
  styleUrl: '../../../shared/styles/detail-page.scss',
})
export class GuideDetail {
  readonly id = input.required<string>();

  private guides = inject(GuidesStore);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private breadcrumb = inject(BreadcrumbService);
  readonly autoSave = inject(AutoSaveService);

  private readonly guideId = computed(() => Number(this.id()));
  readonly guide = computed<Guide | undefined>(
    () => this.guides.guideById()[this.guideId()],
  );
  readonly isNotFound = computed(
    () => !this.guide() && !!this.guides.notFoundIds()[this.guideId()],
  );

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isOffice = this.auth.isOfficeOrAbove;
  private readonly permission = this.auth.permission;

  readonly isOwnProfile = computed(() => {
    const guideId = this.permission().guideId;
    return guideId != null && guideId === this.guideId();
  });

  readonly canView = computed(() => {
    const perm = this.permission();
    return (
      perm.permissionLevel >= PermissionLevel.coordinator ||
      this.isOwnProfile()
    );
  });

  readonly canEdit = computed(
    () => this.isOffice() || this.isOwnProfile(),
  );

  readonly saveErrorSummary = computed(() =>
    this.guides
      .lastSaveErrors()
      .map((e) => describeSaveErrorPath(e.path))
      .join(', '),
  );

  readonly form = signal<FormGroup | undefined>(undefined);
  private builtForId: number | null = null;

  constructor() {
    effect(() => {
      const id = this.guideId();
      if (id && this.canView() && !this.guide() && !this.isNotFound()) {
        untracked(() => this.guides.loadGuide(id));
      }
    });

    effect(() => {
      const g = this.guide();
      this.breadcrumb.setDetailTitle(
        g ? `${g.firstName} ${g.lastName}`.trim() || g.userName : null,
      );
    });

    effect(() => {
      const g = this.guide();
      const editable = this.canEdit();
      if (!g) {
        return;
      }
      if (this.builtForId !== g.id) {
        this.builtForId = g.id;
        this.guides.clearSaveErrors();
        this.buildForm(g, editable);
        this.autoSave.start({
          form: () => this.form(),
          save: () => this.persist(true),
        });
      } else {
        const fg = this.form();
        if (fg) {
          if (editable && fg.disabled) {
            fg.enable({ emitEvent: false });
          } else if (!editable && fg.enabled) {
            fg.disable({ emitEvent: false });
          }
        }
      }
      this.autoSave.enabled.set(editable);
    });
  }

  private buildForm(guide: Guide, editable: boolean): void {
    const p: GuideProfile = { ...EMPTY_GUIDE_PROFILE, ...(guide.profile ?? {}) };
    const group = this.fb.nonNullable.group({
      name: [p.name, [Validators.maxLength(100)]],
      city: [p.city, [Validators.maxLength(150)]],
      job: [p.job, [Validators.maxLength(250)]],
      hobby: [p.hobby, [Validators.maxLength(1000)]],
      reason: [p.reason, [Validators.maxLength(2000)]],
      tip: [p.tip, [Validators.maxLength(1000)]],
    });
    if (!editable) {
      group.disable({ emitEvent: false });
    }
    this.form.set(group);
  }

  persist(silent = false): void {
    const guide = this.guide();
    const fg = this.form();
    if (!guide || !fg || !this.canEdit()) {
      return;
    }
    if (fg.invalid) {
      fg.markAllAsTouched();
      return;
    }
    const profile = fg.getRawValue() as GuideProfile;
    this.guides.save({ id: guide.id, profile, silent });
  }

  save(): void {
    const fg = this.form();
    if (!fg || fg.invalid) {
      fg?.markAllAsTouched();
      return;
    }
    this.persist(false);
    fg.markAsPristine();
  }
}
