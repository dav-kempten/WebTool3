/** Wire format of /api/frontend/requirements/ — the season's demand overview. */

export interface RequirementEntry {
  /** null for a kind that has events but no target of its own. */
  id: number | null;
  categoryId: number;
  code: string;
  name: string;
  minimum: number;
  /** Equals `minimum` unless the target is a span such as 10-12. */
  maximum: number;
  actual: number;
}

export interface RequirementGroup {
  kind: 'instruction' | 'tour';
  label: string;
  minimum: number;
  maximum: number;
  actual: number;
  entries: RequirementEntry[];
  /** Kinds running without a target — shown apart, never in the totals. */
  unplanned: RequirementEntry[];
}

export interface RequirementOverview {
  season: string;
  /**
   * The counted program year, both days inclusive — it starts in November, so
   * it is not the calendar year the season is named after.
   */
  periodStart: string;
  periodEnd: string;
  groups: RequirementGroup[];
}
