
# WebTool – Frontend (Angular 21)

Modern rebuild of the DAV Allgäu-Kempten WebTool SPA. Talks to the same Django REST
API as the legacy `../frontend` app (`/api/frontend/*`, `/api/login/`, `/api/logout/`).

Stack: **Angular 21 (standalone, zoneless) · PrimeNG 21 (Aura theme) · @ngrx/signals · SCSS · vitest**.

## Requirements

- **Node ≥ 20.19** (Angular 21 requirement). Developed against Node 24 LTS.

## Development

```bash
npm install
npm start          # ng serve on http://localhost:4201, proxies /api to :8000
```

Run the Django backend first (`docker compose up` from the repo root, then `migrate`,
`createcachetable`, `init_season`). The dev server runs on **4201** so it can coexist
with the legacy frontend on 4200.

## Build & test

```bash
npm run build      # production build (dist/frontend-new)
npm test           # vitest unit tests (--watch=false for CI)
```

## Architecture

- `src/app/core/services` — HTTP services + `AuthService` (signals) + `AutoSaveService`.
- `src/app/core/stores` — `@ngrx/signals` SignalStores (`ValuesStore`, `NamesStore`,
  `ToursStore`, `EventsStore`) replacing the legacy NgRx store.
- `src/app/core/layout` — app shell (menubar, breadcrumb, login dialogs).
- `src/app/features/<area>` — lazily loaded feature pages.
- `src/app/models` — wire/UI interfaces ported from the legacy app.

### Auto-save

`AutoSaveService` (provided per detail page) saves the form every **2 minutes** when it
is `dirty` and `valid`, then marks it pristine; a final save runs on navigation away.
Wired into the **tour**, **instruction**, and **collective/session** detail pages.

## Feature status

| Area | List | Detail | Auto-save |
| --- | --- | --- | --- |
| Touren (tours) | ✅ | ✅ | ✅ |
| Kurse (instructions) | ✅ | ✅ (+ dynamic meetings) | ✅ |
| Gruppen (collectives/sessions) | ✅ | ✅ | ✅ |
| Trainer (guides) | ✅ | ✅ (profile) | – |
| Events (talks) | placeholder | placeholder | – |

`Events/talks` is a placeholder (`ComingSoon`) — it was never implemented in the legacy
frontend either (its detail rendered only `Talk #id`).
