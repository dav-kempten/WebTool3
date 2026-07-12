import {
  Component,
  OnInit,
  computed,
  inject,
  model,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

import { InstructionsStore } from '../../../core/stores/instructions.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { toIsoDate } from '../../util/date';

/**
 * "Neuer Kurs" dialog with the minimal inputs (Thema, Startdatum). On success
 * the InstructionsStore navigates straight to the new course's detail page.
 */
@Component({
  selector: 'avk-instruction-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './instruction-create-dialog.html',
  styleUrl: '../tour-create-dialog/tour-create-dialog.scss',
})
export class InstructionCreateDialog implements OnInit {
  private instructions = inject(InstructionsStore);
  private values = inject(ValuesStore);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly visible = model(false);

  readonly form = this.fb.group({
    topicId: this.fb.control<number | null>(null, Validators.required),
    startDate: this.fb.control<Date | null>(null, Validators.required),
  });

  readonly topics = computed(() => this.values.topics());

  /**
   * Reset on dialog open via (onShow). Deliberately NOT an effect() on
   * `visible` — the effect re-ran during later change-detection cycles and
   * wiped the form right after each p-select selection.
   */
  onOpen(): void {
    this.form.reset();
  }

  ngOnInit(): void {
    this.values.loadValues();
  }

  create(): void {
    const value = this.form.getRawValue();
    if (!value.topicId || !value.startDate) {
      return;
    }
    const perm = this.auth.permission();
    this.instructions.create({
      topicId: value.topicId,
      startDate: toIsoDate(value.startDate)!,
      guideId:
        perm.permissionLevel === PermissionLevel.guide
          ? (perm.guideId ?? null)
          : null,
    });
    this.visible.set(false);
  }
}