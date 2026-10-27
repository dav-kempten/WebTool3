/**
 * What the homepage receives for a tour or course — the client API's detail
 * view, served by `/api/frontend/{tours,instructions}/<id>/preview/`. Only the
 * fields the preview shows are typed.
 */
export interface ActivityPreview {
  id: string; // booking code, e.g. "VHF-608"
  title: string;
  category: string;
  categories: string[];
  /** Ready-made HTML from the backend's details(); the homepage shows it as is. */
  description: string;
  startDate: string;
  startTime: string | null;
  endDate: string | null;
  quantity: { min: number; max: number; current: number } | null;
  admission: number | string | null;
  guide: { firstName: string; lastName: string } | null;
  state: string;
  /** Requirement levels 1–3 (tours only); 99 means "not specified". */
  skill: number | null;
  fitness: number | null;
  /** "Besonderheit" in the homepage's sidebar. */
  preconditions: string | null;
  /** Equipment sets plus the free-text "Zusätzliche Ausrüstung" (misc). */
  equipments: { list?: { code: string; name: string }[]; misc?: string } | null;
}
