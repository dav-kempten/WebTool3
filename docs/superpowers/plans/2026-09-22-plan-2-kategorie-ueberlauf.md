# Plan 2: Namensraum-Erschöpfung sauber behandeln

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wenn die 990 Buchungscodes einer (Saison, Kategorie) aufgebraucht sind, meldet die API einen verständlichen Fehler statt eines HTTP 500 — und man sieht das Volllaufen vorher kommen.

**Architecture:** Der Kategorie-Klon in `create_reference` wird ersatzlos entfernt (Spec, Entscheidung E2) und durch eine eigene Ausnahme `ReferenceSpaceExhausted` ersetzt. `create_event` fängt sie und macht daraus eine DRF-`ValidationError`, also HTTP 400 mit lesbarem Text. Dazu kommt ein Management-Kommando, das die Auslastung je (Saison, Kategorie) berichtet, damit das Volllaufen planbar wird statt überraschend.

**Tech Stack:** Python 3.12, Django 6.0.5, Django REST Framework, pytest-django

**Spec:** `docs/superpowers/plans/2026-09-22-buchungscodes-spec.md` (Problem P2, Entscheidung E2)

**Voraussetzung:** Plan 0 ist abgeschlossen, `uv run pytest` ist grün. Plan 1 ist **nicht** Voraussetzung.

## Global Constraints

Siehe Abschnitt 6 der Spec. Für diesen Plan zusätzlich bindend:

- `Category.code` bleibt `max_length=3`. Es zu verbreitern schlüge auf Druckerzeugnisse durch.
- Keine Migration, kein Daten-Backfill.
- Die 990-Grenze selbst wird nicht angehoben.
- `find_free_references` bleibt unverändert; nur der Umgang mit seinem `None`-Rückgabewert ändert sich.

## File Structure

| Datei | Änderung | Verantwortung |
|---|---|---|
| `webtool/server/models/reference.py` | ändern | `ReferenceSpaceExhausted`; `create_reference` wirft statt zu klonen |
| `webtool/server/models/__init__.py:20` | ändern | Ausnahme mitexportieren |
| `webtool/server/serializers/frontend/core.py:99-104` | ändern | Ausnahme in HTTP 400 übersetzen |
| `webtool/server/management/commands/check_reference_space.py` | neu | Auslastungsbericht |
| `webtool/server/tests/test_reference_space.py` | neu | Tests für Ausnahme, Übersetzung und Kommando |

---

### Task 1: Erschöpfung als eigene Ausnahme, Klon entfernen

**Files:**
- Modify: `webtool/server/models/reference.py` (Modulkopf und `create_reference`)
- Modify: `webtool/server/models/__init__.py:20`
- Test: `webtool/server/tests/test_reference_space.py`

**Interfaces:**
- Consumes: Fixtures `make_season`, `make_category` aus Plan 0
- Produces: `ReferenceSpaceExhausted(category, season)` mit Attributen `.category` und `.season`, importierbar aus `server.models`

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

Datei `webtool/server/tests/test_reference_space.py`:

```python
# -*- coding: utf-8 -*-
import pytest

from server.models import Category, Reference, ReferenceSpaceExhausted


def fill(season, category, skip=None):
    """Occupy all 990 slots of one (season, category), optionally leaving one free."""
    Reference.objects.bulk_create([
        Reference(season=season, category=category, prefix=p, reference=r)
        for p in range(10)
        for r in range(1, 100)
        if (p, r) != skip
    ])


@pytest.mark.django_db
def test_create_reference_uses_the_last_free_slot(make_season, make_category):
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category, skip=(7, 42))

    created = Reference.create_reference(category=category, prefix=5, season=season)

    assert (created.prefix, created.reference) == (7, 42)


@pytest.mark.django_db
def test_create_reference_raises_when_every_slot_is_taken(make_season, make_category):
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category)

    with pytest.raises(ReferenceSpaceExhausted) as excinfo:
        Reference.create_reference(category=category, prefix=5, season=season)

    assert 'KT1' in str(excinfo.value)
    assert '2025' in str(excinfo.value)
    assert excinfo.value.category == category
    assert excinfo.value.season == season


@pytest.mark.django_db
def test_a_full_category_is_not_cloned(make_season, make_category):
    """The old escape hatch invented a new category code from an internal
    counter. For KT1 it would have created KT2, for KT9 a four character code
    the column cannot hold."""
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category)

    with pytest.raises(ReferenceSpaceExhausted):
        Reference.create_reference(category=category, prefix=5, season=season)

    assert Category.objects.count() == 1
    assert not Category.objects.filter(code='KT2').exists()
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

```bash
uv run pytest webtool/server/tests/test_reference_space.py -v
```

Erwartet: FAIL beim Import — `cannot import name 'ReferenceSpaceExhausted' from 'server.models'`.

- [ ] **Step 3: Ausnahme anlegen und Klon entfernen**

In `webtool/server/models/reference.py`, direkt unter `REFERENCE_RANGE = set(range(1, 100))`:

```python
class ReferenceSpaceExhausted(Exception):
    """All booking codes of one (season, category) pair are taken.

    Replaces the former category-cloning escape hatch. That path derived a new
    category code by incrementing the last character, which raised DataError
    for codes ending in 9 (four characters against a varchar(3) column),
    IntegrityError when the incremented code already existed, and a misleading
    Category.DoesNotExist for the 118 codes that do not end in a digit at all.
    """

    def __init__(self, category, season):
        self.category = category
        self.season = season
        super().__init__(
            'Alle {} Buchungscodes der Kategorie "{}" sind in Saison {} vergeben.'.format(
                len(REFERENCE_RANGE) * 10, category.code, season.name
            )
        )
```

Dann in `create_reference` den gesamten Block ab `if reference is None:` bis
unmittelbar vor `return reference` ersetzen. Aus:

```python
        if reference is None:
            category_code = category.code
            category_index = category_code[-1]
            if category_index < "0" or category_index > "9":
                print('Category "{}" hat keinen Zähler'.format(category_code))
                # noinspection PyCallByClass
                raise Category.DoesNotExist("Reference matching query does not exist.")
            category.pk = None
            category_index = int(category_index) + 1
            category.code = "{}{:1d}".format(category_code[:2], category_index)
            category.save()
            category.seasons.add(season)
            reference = Reference.create_reference(category=category, prefix=prefix, season=season, **kwargs)
        return reference
```

wird:

```python
        if reference is None:
            raise ReferenceSpaceExhausted(category, season)
        return reference
```

In `webtool/server/models/__init__.py` Zeile 20 erweitern:

```python
from .reference import Reference, ReferenceSpaceExhausted
```

- [ ] **Step 4: Tests laufen lassen, Erfolg bestätigen**

```bash
uv run pytest webtool/server/tests/test_reference_space.py -v
```

Erwartet: 3 passed.

- [ ] **Step 5: Gesamtlauf**

```bash
uv run pytest
```

Erwartet: alle grün. Falls `Category` in `reference.py` danach ungenutzt ist,
den Import stehen lassen — `create_reference` benutzt ihn weiterhin für die
Auflösung per Code-String.

- [ ] **Step 6: Commit**

```bash
git add webtool/server/models/reference.py webtool/server/models/__init__.py webtool/server/tests/test_reference_space.py
```

```bash
git commit -m "fix: raise ReferenceSpaceExhausted instead of cloning a full category"
```

---

### Task 2: Aus dem 500er einen 400er machen

**Files:**
- Modify: `webtool/server/serializers/frontend/core.py:6` (Import) und `:99-104` (`create_event`)
- Test: `webtool/server/tests/test_reference_space.py` (ergänzen)

**Interfaces:**
- Consumes: `ReferenceSpaceExhausted` aus Task 1
- Produces: `create_event` wirft `rest_framework.serializers.ValidationError` mit Schlüssel `reference` statt die Ausnahme durchzulassen

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

An `webtool/server/tests/test_reference_space.py` anhängen:

```python
@pytest.mark.django_db
def test_create_event_reports_exhaustion_as_a_validation_error(
        make_season, make_category):
    """Unhandled, this used to surface as HTTP 500 when a guide tried to create
    an event in a full category."""
    import datetime

    from rest_framework import serializers as drf_serializers

    from server.serializers.frontend.core import create_event

    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category)

    with pytest.raises(drf_serializers.ValidationError) as excinfo:
        create_event(
            {'pk': None, 'deprecated': False, 'start_date': datetime.date(2025, 6, 1)},
            {'category': category, 'season': season, 'type': {}},
        )

    assert 'reference' in excinfo.value.detail
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
uv run pytest webtool/server/tests/test_reference_space.py -v -k validation_error
```

Erwartet: FAIL — es kommt `ReferenceSpaceExhausted` statt `ValidationError` durch.

- [ ] **Step 3: Übersetzung einbauen**

In `webtool/server/serializers/frontend/core.py` den Modelimport in Zeile 6 erweitern:

```python
from server.models import Event, Approximate, Reference, ReferenceSpaceExhausted
```

In `create_event` den Aufruf umschließen. Aus:

```python
        reference = Reference.create_reference(
            category=category,
            prefix=str(start_date.year)[-1] if start_date else season.name[-1],
            season=season,
            **event_type
        )
```

wird:

```python
        try:
            reference = Reference.create_reference(
                category=category,
                prefix=str(start_date.year)[-1] if start_date else season.name[-1],
                season=season,
                **event_type
            )
        except ReferenceSpaceExhausted as exception:
            # Ohne diese Übersetzung landet die Erschöpfung als HTTP 500 beim
            # Leiter, der gerade eine Veranstaltung anlegen will.
            raise serializers.ValidationError({'reference': str(exception)})
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

```bash
uv run pytest webtool/server/tests/test_reference_space.py -v
```

Erwartet: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add webtool/server/serializers/frontend/core.py webtool/server/tests/test_reference_space.py
```

```bash
git commit -m "fix: turn an exhausted booking code space into a 400 instead of a 500"
```

---

### Task 3: Auslastung sichtbar machen

**Files:**
- Create: `webtool/server/management/commands/check_reference_space.py`
- Test: `webtool/server/tests/test_reference_space.py` (ergänzen)

**Interfaces:**
- Consumes: nichts aus Task 1 oder 2; rein lesend
- Produces: Kommando `check_reference_space [--season JAHR] [--threshold PROZENT]`;
  Exitcode über `CommandError`, wenn mindestens eine Kombination die Schwelle reißt

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

An `webtool/server/tests/test_reference_space.py` anhängen:

```python
@pytest.mark.django_db
def test_check_reference_space_reports_usage(make_season, make_category):
    from io import StringIO

    from django.core.management import call_command

    season = make_season('2025', current=True)
    category = make_category('KT1')
    Reference.objects.bulk_create([
        Reference(season=season, category=category, prefix=0, reference=r)
        for r in range(1, 100)
    ])

    out = StringIO()
    call_command('check_reference_space', stdout=out)
    output = out.getvalue()

    assert 'KT1' in output
    assert '99/990' in output


@pytest.mark.django_db
def test_check_reference_space_fails_above_the_threshold(make_season, make_category):
    from django.core.management.base import CommandError

    from django.core.management import call_command

    season = make_season('2025', current=True)
    category = make_category('KT1')
    Reference.objects.bulk_create([
        Reference(season=season, category=category, prefix=p, reference=r)
        for p in range(10)
        for r in range(1, 100)
    ])

    with pytest.raises(CommandError):
        call_command('check_reference_space', '--threshold', '50')
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

```bash
uv run pytest webtool/server/tests/test_reference_space.py -v -k check_reference_space
```

Erwartet: FAIL mit `Unknown command: 'check_reference_space'`.

- [ ] **Step 3: Kommando implementieren**

Datei `webtool/server/management/commands/check_reference_space.py`:

```python
# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count

from server.models import Reference
from server.models.reference import REFERENCE_RANGE

# 10 Prefixe (0..9) mal die Referenzen 1..99
CAPACITY = len(REFERENCE_RANGE) * 10


class Command(BaseCommand):

    help = (
        'Report how full the booking code space of every (season, category) pair is. '
        'A pair holds {} codes; once they are gone no further event can be created in '
        'that category and season, and create_reference raises '
        'ReferenceSpaceExhausted.'.format(CAPACITY)
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--season', default=None,
            help='Limit the report to one season, e.g. 2026'
        )
        parser.add_argument(
            '--threshold', type=int, default=50,
            help='Exit with an error if a pair is at or above this percentage (default 50)'
        )

    def handle(self, *args, **options):
        season = options['season']
        threshold = options['threshold']

        queryset = Reference.objects.all()
        if season:
            queryset = queryset.filter(season__name=str(season))

        rows = (
            queryset
            .values('season__name', 'category__code')
            .annotate(used=Count('pk'))
            .order_by('-used')
        )

        breached = []
        for row in rows:
            used = row['used']
            percent = 100.0 * used / CAPACITY
            line = '{}  {:4s}  {:4d}/{}  {:5.1f}%'.format(
                row['season__name'], row['category__code'], used, CAPACITY, percent
            )
            if percent >= threshold:
                breached.append(line)
                self.stdout.write(self.style.WARNING(line))
            else:
                self.stdout.write(line)

        if not rows:
            self.stdout.write('no booking codes found')
            return

        if breached:
            raise CommandError(
                '{} (season, category) pair(s) at or above {}% of {} codes.'.format(
                    len(breached), threshold, CAPACITY
                )
            )
```

- [ ] **Step 4: Tests laufen lassen, Erfolg bestätigen**

```bash
uv run pytest webtool/server/tests/test_reference_space.py -v
```

Erwartet: 6 passed.

- [ ] **Step 5: Gesamtlauf**

```bash
uv run pytest
```

- [ ] **Step 6: Commit**

```bash
git add webtool/server/management/commands/check_reference_space.py webtool/server/tests/test_reference_space.py
```

```bash
git commit -m "feat: add check_reference_space to see a full category coming"
```

---

## Nach dem Plan

Gegen die echte Datenbank laufen lassen, um den Ausgangswert festzuhalten:

```bash
python manage.py check_reference_space --threshold 50
```

Erwartungswert nach dem Stand vom 2026-09-22: die höchste Auslastung war
2023/KT9 mit 663/990 (67 %), alles andere unter 25 %. Mit `--threshold 50`
sollte also genau ein Treffer kommen.

Was dieser Plan **nicht** löst: eine wirklich volle Kategorie bleibt voll. Der
Unterschied ist, dass das jetzt eine lesbare Fehlermeldung ist statt eines 500ers,
und dass man es kommen sieht. Die Optionen danach — Kategorie fachlich aufteilen,
`Category.code` verbreitern, oder `reference` auf drei Stellen gehen — sind alle
mit Auswirkungen auf gedruckte Codes verbunden und gehören in eine eigene
Entscheidung.
