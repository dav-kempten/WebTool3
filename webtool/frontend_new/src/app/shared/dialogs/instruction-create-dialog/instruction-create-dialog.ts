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
import { TooltipModule } from 'primeng/tooltip';

import { Topic } from '../../../models/value';
import { InstructionsStore } from '../../../core/stores/instructions.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { toIsoDate, tomorrow } from '../../util/date';

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
    TooltipModule,
  ],
  templateUrl: './instruction-create-dialog.html',
  styleUrl: '../../styles/create-dialog.scss',
})
export class InstructionCreateDialog implements OnInit {
  private instructions = inject(InstructionsStore);
  private values = inject(ValuesStore);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly visible = model(false);

  readonly minDate = tomorrow();

  readonly form = this.fb.group({
    topicId: this.fb.control<number | null>(null, Validators.required),
    startDate: this.fb.control<Date | null>(null, Validators.required),
  });

  /**
   * Grouped by season. `Topic.category` is a primary-key one-to-one on the
   * backend, so a topic's id *is* its category's id. Pure indoor topics match
   * neither group and therefore drop out — mixed ones (e.g. summer + indoor)
   * stay, since only *pure* indoor offerings are meant to be excluded.
   */
  readonly topicGroups = computed(() => {
    const categoryById = this.values.categoryById();
    const summer: Topic[] = [];
    const winter: Topic[] = [];
    for (const topic of this.values.topics()) {
      const category = categoryById.get(topic.id);
      if (category?.summer) {
        summer.push(topic);
      } else if (category?.winter) {
        winter.push(topic);
      }
    }
    const byTitle = (a: Topic, b: Topic) => a.title.localeCompare(b.title, 'de');
    return [
      { label: 'Sommer', items: summer.sort(byTitle) },
      { label: 'Winter', items: winter.sort(byTitle) },
    ].filter((group) => group.items.length > 0);
  });

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