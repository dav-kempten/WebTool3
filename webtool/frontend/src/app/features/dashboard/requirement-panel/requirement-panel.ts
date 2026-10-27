import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RequirementsStore } from '../../../core/stores/requirements.store';
import {
  RequirementEntry,
  RequirementGroup,
  RequirementSection,
} from '../../../models/requirement';

/**
 * Where one kind of event stands against its target. Carried as data rather
 * than derived in the template, because it drives the colour, the icon and the
 * wording together — a status is never signalled by colour alone.
 */
export type RequirementStatus = 'met' | 'short' | 'open';

export interface RequirementRow {
  code: string;
  name: string;
  actual: number;
  minimum: number;
  maximum: number;
  status: RequirementStatus;
  /** Share of the track the bar fills, 0-100. */
  fill: number;
  /** Where the lower bound sits on the track, or null when the target is exact. */
  tick: number | null;
  /** "10–12" or "4". */
  target: string;
  /** "noch 5" or "erfüllt". */
  note: string;
  icon: string;
  hint: string;
}

export interface RequirementGroupView {
  kind: string;
  label: string;
  actual: number;
  minimum: number;
  maximum: number;
  /** Progress towards the lower bound, capped at 100 for the donut. */
  percent: number;
  status: RequirementStatus;
  missing: number;
  rows: RequirementRow[];
  unplanned: RequirementEntry[];
  /** "3 Veranstaltungen in 2 Arten ohne Bedarfsvorgabe", correctly declined. */
  unplannedLabel: string;
}

export interface RequirementSectionView {
  part: string;
  label: string;
  actual: number;
  minimum: number;
  missing: number;
  status: RequirementStatus;
  /** "Kurse 22/49 · Touren 5/68" — readable while the block is collapsed. */
  summary: string;
  groups: RequirementGroupView[];
}

const STATUS_ICONS: Record<RequirementStatus, string> = {
  met: 'pi pi-check-circle',
  short: 'pi pi-exclamation-circle',
  open: 'pi pi-times-circle',
};

const STATUS_LABELS: Record<RequirementStatus, string> = {
  met: 'Bedarf gedeckt',
  short: 'noch offen',
  open: 'nichts eingestellt',
};

function statusOf(actual: number, minimum: number): RequirementStatus {
  if (actual >= minimum) {
    return 'met';
  }
  return actual === 0 ? 'open' : 'short';
}

function unplannedLabel(entries: RequirementEntry[]): string {
  const events = entries.reduce((sum, entry) => sum + entry.actual, 0);
  const kinds = entries.length;
  return (
    `${events} ${events === 1 ? 'Veranstaltung' : 'Veranstaltungen'}` +
    ` in ${kinds} ${kinds === 1 ? 'Art' : 'Arten'} ohne Bedarfsvorgabe`
  );
}

function percentOf(actual: number, target: number): number {
  if (target <= 0) {
    return actual > 0 ? 100 : 0;
  }
  return Math.min(100, Math.round((actual / target) * 100));
}

@Component({
  selector: 'avk-requirement-panel',
  standalone: true,
  imports: [CardModule, ButtonModule, DatePipe],
  templateUrl: './requirement-panel.html',
  styleUrl: './requirement-panel.scss',
})
export class RequirementPanel {
  private store = inject(RequirementsStore);

  readonly season = this.store.season;
  readonly periodStart = this.store.periodStart;
  readonly periodEnd = this.store.periodEnd;
  readonly loading = this.store.loading;
  readonly loaded = this.store.loaded;
  readonly failed = this.store.failed;

  readonly statusLabels = STATUS_LABELS;
  readonly statusIcons = STATUS_ICONS;
  readonly legend: RequirementStatus[] = ['open', 'short', 'met'];

  readonly sections = computed<RequirementSectionView[]>(() =>
    this.store.sections().map((section) => this.toSection(section)),
  );

  /** True once there is a target to show — an empty season says so instead. */
  readonly hasTargets = computed(() =>
    this.sections().some((section) =>
      section.groups.some((group) => group.rows.length > 0),
    ),
  );

  refresh(): void {
    this.store.load();
  }

  private toSection(section: RequirementSection): RequirementSectionView {
    const groups = section.groups.map((group) => this.toView(group));
    return {
      part: section.part,
      label: section.label,
      actual: section.actual,
      minimum: section.minimum,
      missing: Math.max(0, section.minimum - section.actual),
      status: statusOf(section.actual, section.minimum),
      summary: groups
        .filter((group) => group.rows.length > 0)
        .map((group) => `${group.label} ${group.actual}/${group.minimum}`)
        .join(' · '),
      groups,
    };
  }

  private toView(group: RequirementGroup): RequirementGroupView {
    const missing = Math.max(0, group.minimum - group.actual);
    return {
      kind: group.kind,
      label: group.label,
      actual: group.actual,
      minimum: group.minimum,
      maximum: group.maximum,
      percent: percentOf(group.actual, group.minimum),
      status: statusOf(group.actual, group.minimum),
      missing,
      rows: group.entries.map((entry) => this.toRow(entry)),
      unplanned: group.unplanned,
      unplannedLabel: unplannedLabel(group.unplanned),
    };
  }

  private toRow(entry: RequirementEntry): RequirementRow {
    const { actual, minimum, maximum, name, code } = entry;
    const status = statusOf(actual, minimum);
    // The track runs to the upper bound, so a span shows its headroom; the tick
    // marks where the target is actually met.
    const track = Math.max(maximum, 1);
    const missing = minimum - actual;
    const target = maximum > minimum ? `${minimum}–${maximum}` : `${minimum}`;

    return {
      code,
      name,
      actual,
      minimum,
      maximum,
      status,
      fill: percentOf(actual, track),
      tick: maximum > minimum ? Math.round((minimum / track) * 100) : null,
      target,
      note: missing > 0 ? `noch ${missing}` : 'erfüllt',
      icon: STATUS_ICONS[status],
      hint:
        missing > 0
          ? `${name}: ${actual} von ${target} eingestellt, ${missing} fehlen noch`
          : `${name}: ${actual} von ${target} eingestellt, Bedarf gedeckt`,
    };
  }
}
