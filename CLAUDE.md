# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebTool3 is a Django-based web application for the DAV (German Alpine Club) section Allgäu Kempten. It manages tours, courses (Kurse), talks (Vorträge), and other events, including guide profiles, qualifications, seasons, and booklet generation. The project language is German; model field names, admin labels, and domain terminology are German.

## Architecture

The project is a **Django REST Framework backend + Angular 21 frontend** (SPA).

```
WebTool3/
├── webtool/               # Django project root (manage.py lives here)
│   ├── config/
│   │   ├── settings/      # base.py, local.py, production.py, travis.py
│   │   └── urls.py
│   ├── server/            # Single Django app with all domain logic
│   │   ├── models/        # One file per domain entity; __init__.py re-exports all
│   │   ├── serializers/
│   │   │   ├── frontend/  # Used by Angular SPA (read-heavy, camelCase JSON)
│   │   │   ├── client/    # Used by external clients/booklet generation
│   │   │   └── auth/      # Login/logout serializers
│   │   ├── views/
│   │   │   ├── frontend/  # ViewSets for Angular SPA
│   │   │   ├── client/    # ViewSets for external client API
│   │   │   └── auth/      # Login/logout views
│   │   ├── filters/       # django-filter FilterSets
│   │   ├── actors/        # Business logic actors (e.g. booklet generation)
│   │   ├── management/commands/  # Custom management commands
│   │   └── migrations/
│   └── frontend/          # Angular 21 SPA (standalone, zoneless, PrimeNG 21)
│       └── src/app/
│           ├── core/      # Stores (@ngrx/signals), services, layout
│           ├── shared/    # Reusable dialogs, styles, util (date, validators)
│           ├── models/    # Wire-format interfaces (tour, instruction, value, …)
│           └── features/  # Lazy-loaded routes
│               ├── dashboard/
│               ├── tours/        # tour-list, tour-detail
│               ├── instructions/ # Courses: instruction-list, instruction-detail
│               ├── sessions/     # Group dates: session-list, session-detail
│               ├── guides/       # Trainers — components exist, route still stubbed
│               └── coming-soon/  # Placeholder for /talks and /trainers
├── pyproject.toml         # Python dependencies (managed with uv)
└── docker-compose.yml     # Local dev: PostgreSQL + Django
```

### API structure

- `/api/frontend/*` — Angular SPA endpoints (ViewSets in `server/views/frontend/`)
- `/api/client/*` — External client endpoints (ViewSets in `server/views/client/`)
- `/api/login/`, `/api/logout/` — Session auth

### Key domain models

- **Season** — The current active season (year). All major entities are scoped to a season.
- **Event** — Base for Tour, Instruction (Kurs), Talk (Vortrag). Has a `Reference` as primary key.
- **Guide** — Staff/volunteer profile linked to Django `User`.
- **State** — Workflow states for events (In Arbeit → Fertig → Freigegeben → Veröffentlicht → Durchgeführt).
- **Collective / Session** — Groups (Gruppen) and their sessions.
- **Booklet** — PDF program booklet generation.

## Development Setup

### Docker (recommended)

```bash
docker compose up
```

The `.env` file at the project root is loaded automatically. On first run, initialize the database:

```bash
docker compose exec web python webtool/manage.py migrate
docker compose exec web python webtool/manage.py createcachetable
docker compose exec web python webtool/manage.py init_season
```

### Local without Docker

Set required environment variables (see `.env` for reference values), then from the project root:

```bash
cd webtool
python manage.py runserver
```

Required env vars: `DJANGO_SETTINGS_MODULE`, `DJCODE_SECRET_KEY`, `DJCODE_DB_ENGINE`, `DJCODE_DB_HOST`, `DJCODE_DB_PORT`, `DJCODE_DB_NAME`, `DJCODE_DB_USER`, `DJCODE_DB_PASSWORD`.

### Frontend development

```bash
cd webtool/frontend
npm install
npm start          # ng serve on :4201, proxy to Django on :8000
```

The proxy (`proxy.conf.json`) forwards `/api/login/`, `/api/logout/`, and `/api/frontend/*` to `http://localhost:8000`.

The dev server uses port **4201** (`angular.json`), a leftover from the time the
old Angular 7 app still occupied 4200 — it can be moved back now that the old
frontend is gone.

## Commands

### Django

```bash
# Run from webtool/ directory (or use docker compose exec web ...)
python manage.py migrate
python manage.py createcachetable
python manage.py init_season          # Seed all reference data for a new season
python manage.py publish_events       # Publish approved events
python manage.py update_seasons       # Update season-scoped data
python manage.py replication          # Replicate data to external system
```

### Backend tests

pytest + pytest-django. Tests live in `webtool/server/tests/`; shared fixtures are in
`webtool/conftest.py`. Config sits in `pyproject.toml` (`[tool.pytest.ini_options]`).

```bash
# Requires the PostgreSQL container: docker compose up -d db
uv pip install "pytest>=8.0" "pytest-django>=4.9" "pytest-cov>=6.0"

pytest                       # from the project root
pytest --create-db           # rebuild the test DB after model changes
pytest --cov=server          # with coverage
```

One thing to know about the setup:

- **Reference data comes from `init_season`**, seeded once per session by the
  `django_db_setup` fixture. Nearly every model default (`defaults.get_default_state`
  and friends) resolves through `Season.objects.get(current=True)`, so without a
  current season no event can be created at all. The command seeds season **2018**,
  while `TourViewSet.queryset` only returns tours starting on or after 1 January of
  the previous year — test tours therefore need a current-year `start_date`.

### Frontend

```bash
cd webtool/frontend
npm run build     # Production build
npm test          # ng test (Karma) — no specs written yet beyond app.spec.ts
npm run watch     # Rebuild on change (development configuration)
```

Production build for deployment at the web root — the app is served at `/`,
`src/index.html` already carries `<base href="/">`, so no `--base-href` is needed:

```bash
npm run build     # output: dist/frontend-new/browser
```

## Settings

Settings are layered: `base.py` → environment-specific override.

- `local.py` — Docker dev; reads `DATABASE_URL` via `django-environ`, `DEBUG=True`
- `production.py` — Production; `DEBUG=False`, specific `ALLOWED_HOSTS`, CORS whitelist
- `travis.py` — CI; minimal overrides on top of base

All sensitive values (secret key, DB credentials) come from environment variables via `get_env()` in `base.py`.

## Serializer conventions

Frontend serializers use **camelCase** field names (e.g. `startDate`, `guideId`, `stateId`) to match Angular conventions, while Django models use **snake_case**. The mapping is done explicitly in each serializer's field declarations.