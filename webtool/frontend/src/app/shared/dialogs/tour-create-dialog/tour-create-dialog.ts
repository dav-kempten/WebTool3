import {
  Component,
  OnInit,
  computed,
  inject,
  model,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';

import { Category } from '../../../models/value';
import { ToursStore } from '../../../core/stores/tours.store';
import { ValuesStore } from '../../../core/stores/values.store';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionLevel } from '../../../core/services/permission';
import { toIsoDate, tomorrow } from '../../util/date';

/**
 * "Neue Tour" dialog with the minimal inputs (Tourenart, Startdatum,
 * Anmeldeschluss, optionale Vorbesprechung). On success the ToursStore
 * navigates straight to the new tour's detail page.
 */
@Component({
  selector: 'avk-tour-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    ToggleButtonModule,
    TooltipModule,
  ],
  templateUrl: './tour-create-dialog.html',
  styleUrl: '../../styles/create-dialog.scss',
})
export class TourCreateDialog implements OnInit {
  private tours = inject(ToursStore);
  private values = inject(ValuesStore);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  readonly visible = model(false);

  readonly minDate = tomorrow();

  readonly preliminaryEnabled = signal(false);
  readonly form = this.fb.group({
    categoryId: this.fb.control<number | null>(null, Validators.required),
    startDate: this.fb.control<Date | null>(null, Validators.required),
    deadline: this.fb.control<Date | null>(null, Validators.required),
    preliminary: this.fb.control<Date | null>(null),
  });

  /**
   * Grouped by season so the 19 categories stay scannable. "Jugend" is not a
   * flag of its own — the backend derives youth tours from the category name
   * (`'Jugend' in category.name`, tours.py), so the same rule is used here to
   * keep both sides in sync.
   */
  readonly categoryGroups = computed(() => {
    const isYouth = (category: Category) => category.name.includes('Jugend');
    const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, 'de');
    const categories = this.values.categories().filter((c) => c.tour);
    return [
      {
        label: 'Sommer',
        items: categories.filter((c) => c.summer && !isYouth(c)).sort(byName),
      },
      {
        label: 'Winter',
        items: categories.filter((c) => c.winter && !isYouth(c)).sort(byName),
      },
      { label: 'Jugend', items: categories.filter(isYouth).sort(byName) },
    ].filter((group) => group.items.length > 0);
  });

  /**
   * Reset on dialog open via (onShow). Deliberately NOT an effect() on
   * `visible` — the effect re-ran during later change-detection cycles and
   * wiped the form right after each p-select selection.
   */
  onOpen(): void {
    this.form.reset();
    this.preliminaryEnabled.set(false);
  }

  ngOnInit(): void {
    this.values.loadValues();
  }

  create(): void {
    const value = this.form.getRawValue();
    if (!value.categoryId || !value.startDate || !value.deadline) {
      return;
    }
    const perm = this.auth.permission();
    this.tours.create({
      categoryId: value.categoryId,
      startDate: toIsoDate(value.startDate)!,
      deadline: toIsoDate(value.deadline)!,
      preliminary: this.preliminaryEnabled()
        ? toIsoDate(value.preliminary)
        : null,
      guideId:
        perm.permissionLevel === PermissionLevel.guide
          ? (perm.guideId ?? null)
          : null,
    });
    this.visible.set(false);
  }
}
