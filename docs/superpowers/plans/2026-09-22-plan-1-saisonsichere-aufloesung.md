# Plan 1: Saisonsichere Auflösung von Buchungscodes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein Buchungscode aus einer vergangenen Saison lässt sich über eine saisonbehaftete URL eindeutig auflösen, statt still auf die gleichnamige Veranstaltung der aktuellen Saison zu zeigen.

**Architecture:** Additiv. Die bestehende Route `/api/client/activities/<code>/` bleibt exakt wie sie ist (aktuelle Saison), damit vorhandene Links und Druckerzeugnisse weiter funktionieren. Daneben kommt `/api/client/activities/<season>/<code>/`. Das an drei Stellen verstreute „aktuelle Saison"-Wissen wandert in eine Funktion `public_events(season=None)`; der ViewSet reicht die Saison aus der URL an `Reference.get_reference` weiter, das den Parameter bereits kennt. Die Antwort führt neu das Feld `season`, damit Clients saisonfeste Links und QR-Codes bauen können.

**Tech Stack:** Python 3.12, Django 6.0.5, Django REST Framework, pytest-django

**Spec:** `docs/superpowers/plans/2026-09-22-buchungscodes-spec.md` (Problem P1, Entscheidung E1)

**Voraussetzung:** Plan 0 ist abgeschlossen, `docker compose exec web pytest` ist grün.

## Global Constraints

Siehe Abschnitt 6 der Spec. Für diesen Plan zusätzlich bindend:

- Die bestehende Route `/api/client/activities/<code>/` darf ihr Verhalten **nicht** ändern.
- `Reference.get_reference` behält seine Signatur `(value, season=None)`; sie wird an vielen Stellen aufgerufen.
- Kein Daten-Backfill, keine Migration.
- `booklet.py::validate_references` wird nicht angefasst (Nicht-Ziel der Spec).

## File Structure

| Datei | Änderung | Verantwortung |
|---|---|---|
| `webtool/server/models/reference.py` | ändern | Code-String parsen (`parse_code`), Mehrdeutigkeit sichtbar machen (`seasons_for`) |
| `webtool/server/views/client/activity.py` | ändern | `public_events(season)` als einzige Stelle, die die Sichtbarkeitsregeln kennt; ViewSet reicht die Saison durch |
| `webtool/server/views/client/urls.py` | ändern | zusätzliche saisonbehaftete Detail-Route |
| `webtool/server/views/client/__init__.py` | ändern | `client_urlpatterns` exportieren |
| `webtool/config/urls.py` | ändern | `client_urlpatterns` statt `client_router.urls` einbinden |
| `webtool/server/serializers/client/activity.py` | ändern | Feld `season` in beiden `Meta.fields` |
| `webtool/server/tests/test_reference_codes.py` | neu | Tests zu `parse_code` / `seasons_for` |
| `webtool/server/tests/test_client_activities.py` | neu | End-to-End-Tests der beiden Routen |

---

### Task 1: Code-String parsen und Mehrdeutigkeit abfragbar machen

**Files:**
- Modify: `webtool/server/models/reference.py:60-95` (`get_reference`)
- Test: `webtool/server/tests/test_reference_codes.py`

**Interfaces:**
- Consumes: Fixtures `make_season`, `make_category`, `make_booking_code` aus Plan 0
- Produces:
  - `Reference.parse_code(value) -> (code: str, prefix: int, reference: int)`, wirft `ValueError`
  - `Reference.seasons_for(value) -> list[Season]`, neueste zuerst, leer bei unbekanntem oder kaputtem Code

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

Datei `webtool/server/tests/test_reference_codes.py`:

```python
# -*- coding: utf-8 -*-
import pytest

from server.models import Reference


def test_parse_code_splits_a_booking_code():
    assert Reference.parse_code('BGT-012') == ('BGT', 0, 12)


def test_parse_code_turns_the_two_digit_part_into_an_int():
    """'401' is prefix 4 plus reference '01'; the leading zero only exists in
    the rendered string, which __str__ pads back with {:02d}."""
    assert Reference.parse_code('KT9-401') == ('KT9', 4, 1)


def test_parse_code_rejects_a_malformed_code():
    with pytest.raises(ValueError):
        Reference.parse_code('BGT')


@pytest.mark.django_db
def test_seasons_for_lists_every_season_a_code_exists_in(
        make_season, make_category, make_booking_code):
    category = make_category('BGT')
    old = make_season('2022')
    new = make_season('2023', current=True)
    make_booking_code(old, category, prefix=0, reference=12)
    make_booking_code(new, category, prefix=0, reference=12)

    assert [s.name for s in Reference.seasons_for('BGT-012')] == ['2023', '2022']


@pytest.mark.django_db
def test_seasons_for_is_empty_for_an_unknown_code(make_season, make_category):
    make_season('2023', current=True)
    make_category('BGT')

    assert Reference.seasons_for('BGT-099') == []


@pytest.mark.django_db
def test_seasons_for_is_empty_for_a_malformed_code():
    assert Reference.seasons_for('nonsense') == []
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

```bash
docker compose exec web pytest webtool/server/tests/test_reference_codes.py -v
```

Erwartet: FAIL mit `AttributeError: type object 'Reference' has no attribute 'parse_code'`.

- [ ] **Step 3: `parse_code` und `seasons_for` implementieren**

In `webtool/server/models/reference.py`, innerhalb `class Reference`, direkt vor
`get_reference` einfügen:

```python
    @staticmethod
    def parse_code(value):
        """'BGT-012' -> ('BGT', 0, 12).

        Raises ValueError for anything that is not CODE-PNN. Same splitting
        rule get_reference has always used, just no longer inlined.
        """
        code, prefix, reference = [
            int(x) if x.isnumeric() else x
            for x in re.split(r'-(\d)(\d{2})', value)[:3]
        ]
        return code, prefix, reference

    @staticmethod
    def seasons_for(value):
        """Every season a booking code string exists in, newest first.

        The string is only unique within a season (see Meta.unique_together),
        so a bare code can be ambiguous. This is how a caller finds out.
        """
        try:
            code, prefix, reference = Reference.parse_code(value)
        except ValueError:
            return []
        return list(
            Season.objects
            .filter(
                reference_list__category__code=code,
                reference_list__prefix=prefix,
                reference_list__reference=reference,
            )
            .distinct()
            .order_by('-name')
        )
```

Dann in `get_reference` den inlinen Split durch den Aufruf ersetzen. Aus:

```python
        try:
            code, prefix, reference = [
                int(x) if x.isnumeric() else x for x in re.split(r'-(\d)(\d{2})', value)[:3]
            ]
        except ValueError:
```

wird:

```python
        try:
            code, prefix, reference = Reference.parse_code(value)
        except ValueError:
```

Der `raise Reference.DoesNotExist(...)` darunter bleibt unverändert.

- [ ] **Step 4: Tests laufen lassen, Erfolg bestätigen**

```bash
docker compose exec web pytest webtool/server/tests/test_reference_codes.py -v
```

Erwartet: 6 passed.

- [ ] **Step 5: Gesamtlauf, damit der Refactor nichts gebrochen hat**

```bash
docker compose exec web pytest
```

Erwartet: alle grün.

- [ ] **Step 6: Commit**

```bash
git add webtool/server/models/reference.py webtool/server/tests/test_reference_codes.py
```

```bash
git commit -m "feat: expose booking code parsing and cross-season ambiguity on Reference"
```

---

### Task 2: Sichtbarkeitsregeln in eine Funktion ziehen

**Files:**
- Modify: `webtool/server/views/client/activity.py:13-37` (Klassenkopf) und `:75-99` (`get_object`)
- Test: `webtool/server/tests/test_client_activities.py`

**Interfaces:**
- Consumes: `Reference.get_reference(value, season=None)` — `season` darf ein String wie `'2025'` sein
- Produces: `public_events(season=None) -> QuerySet[Event]`, importierbar aus `server.views.client.activity`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

Datei `webtool/server/tests/test_client_activities.py`:

```python
# -*- coding: utf-8 -*-
import pytest

from server.views.client.activity import public_events


@pytest.mark.django_db
def test_public_events_defaults_to_the_current_season(
        make_season, make_category, make_booking_code):
    category = make_category('BGT')
    old = make_season('2022')
    new = make_season('2023', current=True)
    make_booking_code(old, category, prefix=0, reference=12, title='Alte Tour')
    make_booking_code(new, category, prefix=0, reference=13, title='Neue Tour')

    assert [e.title for e in public_events()] == ['Neue Tour']


@pytest.mark.django_db
def test_public_events_can_be_pinned_to_an_older_season(
        make_season, make_category, make_booking_code):
    category = make_category('BGT')
    old = make_season('2022')
    new = make_season('2023', current=True)
    make_booking_code(old, category, prefix=0, reference=12, title='Alte Tour')
    make_booking_code(new, category, prefix=0, reference=13, title='Neue Tour')

    assert [e.title for e in public_events('2022')] == ['Alte Tour']


@pytest.mark.django_db
def test_public_events_hides_deleted_and_internal_events(
        make_season, make_category, make_booking_code):
    from server.models import Event

    category = make_category('BGT')
    season = make_season('2023', current=True)
    make_booking_code(season, category, prefix=0, reference=12, title='Sichtbar')
    make_booking_code(season, category, prefix=0, reference=13, title='Geloescht')
    make_booking_code(season, category, prefix=0, reference=14, title='Intern')
    Event.objects.filter(title='Geloescht').update(deprecated=True)
    Event.objects.filter(title='Intern').update(internal=True)

    assert [e.title for e in public_events()] == ['Sichtbar']
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
docker compose exec web pytest webtool/server/tests/test_client_activities.py -v
```

Erwartet: FAIL mit `ImportError: cannot import name 'public_events'`.

- [ ] **Step 3: `public_events` implementieren und den ViewSet umstellen**

In `webtool/server/views/client/activity.py`, nach den Imports und vor
`class ActivityViewSet`, einfügen:

```python
def public_events(season=None):
    """Events the client API is allowed to show.

    season=None  -> the season currently flagged as current (old behaviour)
    season='2025' -> exactly that season, no matter which one is current

    This is the only place that knows the visibility rules. Deadlines,
    preliminary meetings and course appointments are never listed; they exist
    only as satellites of the event they belong to.
    """
    if season:
        queryset = Event.objects.filter(season__name=season)
    else:
        queryset = Event.objects.filter(season__current=True)
    return queryset.exclude(
        deprecated=True
    ).exclude(
        internal=True
    ).exclude(
        deadline__isnull=False
    ).exclude(
        preliminary__isnull=False
    ).exclude(
        instruction__isnull=False
    ).exclude(
        tour__isnull=False, tour__state__public=False
    ).exclude(
        talk__isnull=False, talk__state__public=False
    ).exclude(
        meeting__isnull=False, meeting__state__public=False
    ).exclude(
        session__isnull=False, session__state__public=False
    ).distinct()
```

Dann im Klassenkopf die lange `queryset = Event.objects.filter(...)...distinct()`-Kette
ersetzen durch:

```python
    queryset = public_events()   # bleibt für Router und Schema-Generierung
```

und darunter, neben den anderen Methoden, ergänzen:

```python
    def get_queryset(self):
        # 'season' kommt nur aus der saisonbehafteten Route; ohne sie bleibt es
        # bei der aktuellen Saison.
        return public_events(self.kwargs.get('season'))
```

Schließlich in `get_object` die Saison an die Auflösung durchreichen. Aus:

```python
            reference = Reference.get_reference(self.kwargs[self.lookup_url_kwarg])
```

wird:

```python
            reference = Reference.get_reference(
                self.kwargs[self.lookup_url_kwarg],
                season=self.kwargs.get('season'),
            )
```

- [ ] **Step 4: Tests laufen lassen, Erfolg bestätigen**

```bash
docker compose exec web pytest webtool/server/tests/test_client_activities.py -v
```

Erwartet: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add webtool/server/views/client/activity.py webtool/server/tests/test_client_activities.py
```

```bash
git commit -m "refactor: extract public_events and let the activity view take a season"
```

---

### Task 3: Saisonbehaftete Route

**Files:**
- Modify: `webtool/server/views/client/urls.py`
- Modify: `webtool/server/views/client/__init__.py:9`
- Modify: `webtool/config/urls.py:25`
- Test: `webtool/server/tests/test_client_activities.py` (ergänzen)

**Interfaces:**
- Consumes: `public_events(season)` und das `season`-kwarg aus Task 2
- Produces: URL-Name `activities-seasonal`, Pfad `api/client/activities/<season>/<code>/`;
  Modul `server.views.client` exportiert zusätzlich `client_urlpatterns`

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

An `webtool/server/tests/test_client_activities.py` anhängen:

```python
@pytest.mark.django_db
def test_a_bare_code_still_resolves_in_the_current_season(
        client, make_season, make_category, make_booking_code):
    category = make_category('BGT')
    old = make_season('2022')
    new = make_season('2023', current=True)
    make_booking_code(old, category, prefix=0, reference=12, title='Alte Tour')
    make_booking_code(new, category, prefix=0, reference=12, title='Neue Tour')

    response = client.get('/api/client/activities/BGT-012/')

    assert response.status_code == 200
    assert response.json()['title'] == 'Neue Tour'


@pytest.mark.django_db
def test_a_seasonal_url_resolves_the_old_event(
        client, make_season, make_category, make_booking_code):
    """This is the regression the whole plan is about: the same string must be
    able to reach the 2022 event while 2023 is current."""
    category = make_category('BGT')
    old = make_season('2022')
    new = make_season('2023', current=True)
    make_booking_code(old, category, prefix=0, reference=12, title='Alte Tour')
    make_booking_code(new, category, prefix=0, reference=12, title='Neue Tour')

    response = client.get('/api/client/activities/2022/BGT-012/')

    assert response.status_code == 200
    assert response.json()['title'] == 'Alte Tour'


@pytest.mark.django_db
def test_a_seasonal_url_404s_when_the_code_is_not_in_that_season(
        client, make_season, make_category, make_booking_code):
    category = make_category('BGT')
    make_season('2022')
    new = make_season('2023', current=True)
    make_booking_code(new, category, prefix=0, reference=12, title='Neue Tour')

    response = client.get('/api/client/activities/2022/BGT-012/')

    assert response.status_code == 404


@pytest.mark.django_db
def test_an_unknown_season_404s(
        client, make_season, make_category, make_booking_code):
    category = make_category('BGT')
    new = make_season('2023', current=True)
    make_booking_code(new, category, prefix=0, reference=12, title='Neue Tour')

    response = client.get('/api/client/activities/1999/BGT-012/')

    assert response.status_code == 404
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag bestätigen**

```bash
docker compose exec web pytest webtool/server/tests/test_client_activities.py -v -k seasonal
```

Erwartet: FAIL mit Status 404 statt 200 bei `test_a_seasonal_url_resolves_the_old_event`
(die Route existiert noch nicht).

- [ ] **Step 3: Route anlegen**

`webtool/server/views/client/urls.py` — Import ergänzen und `urlpatterns` bauen:

```python
# -*- coding: utf-8 -*-
from django.urls import path
from rest_framework.routers import DefaultRouter
from . import GuideViewSet, ActivityViewSet, TopicViewSet, CollectiveViewSet, BookletViewSet

router = DefaultRouter()
router.register(r'guides', GuideViewSet, basename='guides')
router.register(r'activities', ActivityViewSet, basename='activities')
router.register(r'topics', TopicViewSet, basename='topics')
router.register(r'collectives', CollectiveViewSet, basename='collectives')
router.register(r'booklets', BookletViewSet, basename='booklets')

# Die saisonbehaftete Detail-Route steht vor den Router-Routen. Kollidieren
# kann sie nicht -- der Router matcht activities/<code>/ mit nur einem Segment --
# aber die Reihenfolge macht die Absicht lesbar.
urlpatterns = [
    path(
        'activities/<str:season>/<str:reference>/',
        ActivityViewSet.as_view({'get': 'retrieve'}),
        name='activities-seasonal',
    ),
] + router.urls
```

`webtool/server/views/client/__init__.py` — letzte Zeile ergänzen:

```python
from .urls import router as client_router
from .urls import urlpatterns as client_urlpatterns
```

`webtool/config/urls.py` — Import und Einbindung umstellen:

```python
from server.views.client import client_urlpatterns
```

```python
    re_path(r'^api/client/', include(client_urlpatterns)),
```

- [ ] **Step 4: Tests laufen lassen, Erfolg bestätigen**

```bash
docker compose exec web pytest webtool/server/tests/test_client_activities.py -v
```

Erwartet: 7 passed.

- [ ] **Step 5: Gesamtlauf**

```bash
docker compose exec web pytest
```

Erwartet: alle grün.

- [ ] **Step 6: Commit**

```bash
git add webtool/server/views/client/urls.py webtool/server/views/client/__init__.py webtool/config/urls.py webtool/server/tests/test_client_activities.py
```

```bash
git commit -m "feat: add a season-qualified detail route for booking codes"
```

---

### Task 4: Saison in der Antwort ausweisen

**Files:**
- Modify: `webtool/server/serializers/client/activity.py:9-28` (Felddefinitionen), `:88-107` und `:135-…` (beide `Meta.fields`)
- Test: `webtool/server/tests/test_client_activities.py` (ergänzen)

**Interfaces:**
- Consumes: die Routen aus Task 3
- Produces: Antwortfeld `season` (String, z. B. `"2023"`) in Listen- und Detailantwort

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

An `webtool/server/tests/test_client_activities.py` anhängen:

```python
@pytest.mark.django_db
def test_the_response_names_the_season_it_resolved_to(
        client, make_season, make_category, make_booking_code):
    """Without this a client cannot build a season-proof link back."""
    category = make_category('BGT')
    old = make_season('2022')
    make_season('2023', current=True)
    make_booking_code(old, category, prefix=0, reference=12, title='Alte Tour')

    response = client.get('/api/client/activities/2022/BGT-012/')

    assert response.json()['season'] == '2022'
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
docker compose exec web pytest webtool/server/tests/test_client_activities.py -v -k season_it_resolved
```

Erwartet: FAIL mit `KeyError: 'season'`.

- [ ] **Step 3: Feld ergänzen**

In `webtool/server/serializers/client/activity.py`, in `ActivityListSerializer`
bei den übrigen Felddeklarationen (etwa unterhalb von `id = ...`):

```python
    season = serializers.CharField(source='season.name', read_only=True)
```

Dann `'season',` in **beide** `Meta.fields`-Tupel aufnehmen, jeweils direkt nach
`'id',` — einmal in `ActivityListSerializer.Meta` und einmal in
`ActivitySerializer.Meta`.

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

```bash
docker compose exec web pytest webtool/server/tests/test_client_activities.py -v
```

Erwartet: 8 passed.

- [ ] **Step 5: Gesamtlauf**

```bash
docker compose exec web pytest
```

- [ ] **Step 6: Commit**

```bash
git add webtool/server/serializers/client/activity.py webtool/server/tests/test_client_activities.py
```

```bash
git commit -m "feat: report the resolved season in client activity responses"
```

---

## Nach dem Plan

Die stillen Fehltreffer sind damit **vermeidbar**, aber nicht rückwirkend
behoben: alt gedruckte Codes tragen keine Saison. Wirksam wird der Schutz erst,
wenn neu erzeugte Links und QR-Codes die saisonbehaftete Form verwenden. Das ist
eine Frontend- und Druckvorlagen-Änderung und bewusst nicht Teil dieses Plans.

`Reference.seasons_for` ist die Grundlage, um einen blanken Code künftig als
mehrdeutig zu erkennen — etwa für einen Hinweis „diesen Code gibt es auch in
2022, 2023". Ob und wo dieser Hinweis erscheinen soll, ist eine Produktfrage und
steht bewusst offen.
