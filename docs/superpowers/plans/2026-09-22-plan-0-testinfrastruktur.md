# Plan 0: Testinfrastruktur aufsetzen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pytest + pytest-django lauffähig machen, damit Plan 1 und Plan 2 test-first umgesetzt werden können.

**Architecture:** `pyproject.toml` ist bereits vollständig für pytest-django konfiguriert, aber zwei Bausteine fehlen: das Settings-Modul `config/settings/test.py` und das Paket `webtool/server/tests/`. Die Test-Datenbank kommt aus dem vorhandenen `docker-compose.yml` (Postgres 17); dessen `djcode` ist Container-Superuser und darf damit `test_webtool` anlegen — anders als der `djcode` einer gewachsenen lokalen Installation.

**Tech Stack:** Python 3.12, Django 6.0.5, PostgreSQL 17, uv, pytest, pytest-django, Docker Compose

**Spec:** `docs/superpowers/plans/2026-09-22-buchungscodes-spec.md`

> **Stand 2026-10-23:** Task 1, Steps 3–5 sind erledigt. `config/settings/test.py`,
> `server/tests/__init__.py` und `server/tests/test_constraints.py` lagen seit
> 2026-09-23 unversioniert im Server-Checkout und sind jetzt im Repo — inhaltlich
> wie unten, nur mit ausführlicheren Kommentaren. **Offen:** Task 1 Step 1
> (angepasst), 2 und 6 sowie Task 2. Ein Testlauf hat noch nie stattgefunden.

## Global Constraints

Siehe Abschnitt 6 der Spec. Kurzfassung:

- Python >= 3.12, Django 6.0.5, PostgreSQL 17, Paketverwaltung `uv`
- `DJANGO_SETTINGS_MODULE = "config.settings.test"` (aus `pyproject.toml`)
- `testpaths = ["webtool/server/tests"]`, `python_files = ["test_*.py"]`
- `pythonpath = ["webtool"]`, `addopts = "--reuse-db --strict-markers -ra"`
- Kommentare dürfen deutsch sein, Code und Testnamen englisch
- `webtool/server/migrations/` nicht anfassen

## File Structure

| Datei | Verantwortung |
|---|---|
| `.env` (vorhanden, **nicht anfassen**) | DB-Passwort für Compose; die Tests lesen nur `DJCODE_DB_PASSWORD` daraus |
| `webtool/config/settings/test.py` (erledigt) | Settings für Testläufe: DB aus Umgebung, schnelle Hasher, In-Memory-Cache |
| `webtool/server/tests/__init__.py` (erledigt) | macht `tests` zum Paket |
| `webtool/server/tests/test_constraints.py` (erledigt) | Rauchtest: DB erreichbar, Migrationen laufen, Constraint aus 0002 greift |
| `webtool/server/tests/conftest.py` (neu) | gemeinsame Fixtures für Plan 1 und Plan 2 |
| `webtool/server/tests/test_fixtures.py` (neu) | beweist, dass die Fixtures funktionieren |

---

### Task 1: Testlauf zum Laufen bringen

**Files:**
- Vorhanden, nicht anfassen: `.env`
- Erledigt: `webtool/config/settings/test.py`
- Erledigt: `webtool/server/tests/__init__.py`
- Erledigt: `webtool/server/tests/test_constraints.py`

**Interfaces:**
- Consumes: nichts
- Produces: ein grüner `uv run pytest`-Lauf; das Settings-Modul `config.settings.test`

- [ ] **Step 1: Datenbank starten**

> **Geändert 2026-10-23:** Die ursprüngliche Fassung legte `.env` mit
> `printf … > .env` neu an. Das überschreibt die vorhandene lokale `.env`
> (Secret Key, `DATABASE_URL`, DB-Variablen für den `web`-Container), danach
> startet der Docker-Stack nicht mehr. Außerdem wurde der `db`-Container mit dem
> Passwort aus der vorhandenen `.env` angelegt (`djcode-dev-pw`), nicht mit
> `webtool-local` — Postgres übernimmt ein geändertes Passwort erst nach
> `docker compose down -v`, also nach Löschen der lokalen Datenbank.

Die `.env` bleibt, wie sie ist. Im Repo-Wurzelverzeichnis:

```bash
docker compose up -d db
```

`test.py` fällt ohne Umgebungsvariable auf `webtool-local` zurück. Für die
vorhandene lokale Datenbank deshalb das Passwort aus der `.env` in die Shell
übernehmen — **nur** diese eine Variable, nicht die ganze `.env`: deren
`DJCODE_DB_HOST=db` gilt im Container und ist vom Windows-Host aus nicht
auflösbar; `test.py` setzt dafür `localhost`.

```bash
export DJCODE_DB_PASSWORD=$(grep '^DJCODE_DB_PASSWORD=' .env | cut -d= -f2-)
```

PowerShell:

```powershell
$env:DJCODE_DB_PASSWORD = ((Get-Content .env | Select-String '^DJCODE_DB_PASSWORD=') -split '=', 2)[1]
```

Der `djcode` des Containers ist Postgres-Superuser (er ist `POSTGRES_USER`) und
darf damit `test_webtool` anlegen.

- [ ] **Step 2: Abhängigkeiten installieren**

```bash
uv sync
```

- [x] **Step 3: Testsettings anlegen** — erledigt, siehe Stand oben

Datei `webtool/config/settings/test.py`:

```python
# -*- coding: utf-8 -*-
"""Settings für pytest-django.

Wird über pyproject.toml gezogen (DJANGO_SETTINGS_MODULE = "config.settings.test").
base.py liest die Zugangsdaten beim Import über get_env() aus os.environ und wirft
ImproperlyConfigured, sobald eine Variable fehlt. Die Defaults müssen deshalb VOR
dem Import von base gesetzt werden -- daher der Import nicht am Dateianfang.
"""
import os

os.environ.setdefault('DJCODE_SECRET_KEY', 'test-only-not-a-secret')
os.environ.setdefault('DJCODE_DB_ENGINE', 'django.db.backends.postgresql')
os.environ.setdefault('DJCODE_DB_HOST', 'localhost')
os.environ.setdefault('DJCODE_DB_PORT', '5432')
os.environ.setdefault('DJCODE_DB_NAME', 'webtool')
os.environ.setdefault('DJCODE_DB_USER', 'djcode')
os.environ.setdefault('DJCODE_DB_PASSWORD', 'webtool-local')

from .base import *  # noqa: E402,F401,F403

DEBUG = False
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# base.py cacht in einer DB-Tabelle, die in der Test-DB nicht angelegt wird.
CACHES = {
    'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'},
}

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
```

- [x] **Step 4: Testpaket anlegen** — erledigt

Datei `webtool/server/tests/__init__.py` — leer anlegen:

```bash
mkdir -p webtool/server/tests
```

```bash
printf '' > webtool/server/tests/__init__.py
```

- [x] **Step 5: Rauchtest schreiben** — erledigt

Datei `webtool/server/tests/test_constraints.py`:

```python
# -*- coding: utf-8 -*-
import pytest
from django.db import IntegrityError, transaction

from server.models import Season


@pytest.mark.django_db
def test_a_season_can_be_created():
    """Smoke test: database reachable, migrations applied."""
    season = Season.objects.create(name='2025')
    assert Season.objects.get(pk=season.pk).name == '2025'


@pytest.mark.django_db
def test_only_one_season_can_be_current():
    """Guards the partial unique index created in migration 0002:
    CREATE UNIQUE INDEX ON "server_season" ("current") WHERE "current".
    Several places rely on Season.objects.get(current=True) not raising
    MultipleObjectsReturned."""
    Season.objects.create(name='2025', current=True)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Season.objects.create(name='2026', current=True)
```

- [ ] **Step 6: Tests laufen lassen**

```bash
uv run pytest
```

Erwartet: 2 passed. Beim allerersten Lauf legt pytest-django `test_webtool` an;
das dauert wegen der Migrationen etwa eine Minute. Danach greift `--reuse-db`.

Wenn `permission denied to create database` kommt, zeigt die Umgebung auf eine
andere Postgres-Instanz als die aus Compose. Entweder Compose-DB auf Port 5432
freimachen, oder dem vorhandenen Rollen-Account das Recht geben:
`ALTER ROLE djcode CREATEDB;`

- [x] **Step 7: Commit** — erledigt, zusammen mit diesen Plänen ("Bring the booking code plans and the test bootstrap into the repo")

```bash
git add .gitignore webtool/config/settings/test.py webtool/server/tests/__init__.py webtool/server/tests/test_constraints.py
```

```bash
git commit -m "test: bootstrap pytest-django setup with a constraint smoke test"
```

---

### Task 2: Gemeinsame Fixtures

> **Hinweis 2026-10-23 — Widerspruch zur CLAUDE.md:** Die `CLAUDE.md` beschreibt
> ein anderes Setup als dieser Plan: gemeinsame Fixtures in `webtool/conftest.py`
> und ein `django_db_setup`, das einmal pro Testlauf `init_season` ausführt (Saison
> 2018 als aktuelle). Dieser Plan legt dagegen schmale Fixtures in
> `webtool/server/tests/conftest.py` an, die nur das Nötigste erzeugen. Keine der
> beiden Dateien existiert bisher. Vor der Umsetzung entscheiden, welcher Weg gilt,
> und die jeweils andere Beschreibung angleichen. Für die Buchungscode-Tests
> genügen die schmalen Fixtures; Tests, die echte Touren oder Kurse anlegen, brauchen
> dagegen die Referenzdaten aus `init_season`.

**Files:**
- Create: `webtool/server/tests/conftest.py`
- Test: `webtool/server/tests/test_fixtures.py`

**Interfaces:**
- Consumes: das lauffähige pytest-Setup aus Task 1
- Produces: drei Fixtures, die Plan 1 und Plan 2 benutzen:
  - `make_season(name, current=False) -> Season`
  - `make_category(code, name=None, order=10) -> Category`
  - `make_booking_code(season, category, prefix, reference, title='Testtour') -> str`
    legt `Reference` **und** zugehöriges `Event` an und gibt den Code-String zurück

- [ ] **Step 1: Den Test schreiben, der die Fixtures benutzt**

Datei `webtool/server/tests/test_fixtures.py`:

```python
# -*- coding: utf-8 -*-
import pytest

from server.models import Event, Reference


@pytest.mark.django_db
def test_make_booking_code_creates_a_resolvable_reference(
        make_season, make_category, make_booking_code):
    season = make_season('2025', current=True)
    category = make_category('BGT')

    code = make_booking_code(season, category, prefix=0, reference=12)

    assert code == 'BGT-012'
    assert Reference.objects.filter(season=season, category=category).count() == 1
    assert Event.objects.filter(season=season).count() == 1
    assert Reference.get_reference('BGT-012').season == season


@pytest.mark.django_db
def test_the_same_code_can_exist_in_two_seasons(
        make_season, make_category, make_booking_code):
    """This is the ambiguity the whole spec is about -- unique_together is
    per season, so the string BGT-012 is free to repeat."""
    category = make_category('BGT')
    old = make_season('2022')
    new = make_season('2023', current=True)

    make_booking_code(old, category, prefix=0, reference=12)
    make_booking_code(new, category, prefix=0, reference=12)

    assert Reference.objects.filter(category=category, prefix=0, reference=12).count() == 2
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
uv run pytest webtool/server/tests/test_fixtures.py -v
```

Erwartet: FAIL mit `fixture 'make_season' not found`.

- [ ] **Step 3: Fixtures implementieren**

Datei `webtool/server/tests/conftest.py`:

```python
# -*- coding: utf-8 -*-
"""Fixtures für die Buchungscode-Tests.

Absichtlich schmal gehalten: ein Event braucht nur reference, season, title,
name und start_date: alle anderen Spalten haben einen Django-Default. Ein Event
ohne Tour/Kurs/Vortrag/Gruppentermin passiert alle .exclude()-Klauseln der
Client-API und ist damit sichtbar -- das reicht, um die Auflösung zu testen,
ohne den schweren Tour-Fixture-Baum aufzubauen.
"""
import datetime

import pytest

from server.models import Category, Event, Reference, Season


@pytest.fixture
def make_season(db):
    def make(name, current=False):
        return Season.objects.create(name=str(name), current=current)
    return make


@pytest.fixture
def make_category(db):
    def make(code, name=None, order=10):
        return Category.objects.create(code=code, name=name or code, order=order)
    return make


@pytest.fixture
def make_booking_code(db):
    def make(season, category, prefix, reference, title='Testtour'):
        ref = Reference.objects.create(
            season=season, category=category, prefix=prefix, reference=reference,
        )
        Event.objects.create(
            reference=ref,
            season=season,
            title=title,
            name=title,
            start_date=datetime.date(int(season.name), 6, 1),
        )
        return str(ref)
    return make
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

```bash
uv run pytest webtool/server/tests/test_fixtures.py -v
```

Erwartet: 2 passed.

Falls Postgres eine NOT-NULL-Verletzung meldet, nennt die Meldung die Spalte;
das Feld dann in `Event.objects.create(...)` bzw. `Category.objects.create(...)`
ergänzen. Geprüft wurde gegen das Schema vom 2026-09-22: für `Category` sind
`code`, `name`, `order` nötig, für `Event` `reference`, `season`, `title`,
`name`, `start_date`.

- [ ] **Step 5: Gesamten Testlauf prüfen**

```bash
uv run pytest
```

Erwartet: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add webtool/server/tests/conftest.py webtool/server/tests/test_fixtures.py
```

```bash
git commit -m "test: add booking code fixtures shared by the reference plans"
```
