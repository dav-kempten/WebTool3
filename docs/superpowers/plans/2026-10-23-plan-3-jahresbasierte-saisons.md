# Plan 3: Saison = Jahr der Veranstaltung, automatischer Saisonwechsel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jede Veranstaltung gehört zur Saison ihres Jahres, ihr Buchungscode trägt die Jahresziffer und zählt je Jahr ab 01. Die aktuelle Saison wechselt am 1. Januar von selbst und zieht alle saisongebundenen Stammdaten mit. Client-API und Frontend sehen ein festes Fenster von Saisons statt nur der aktuellen.

**Spec:** `docs/superpowers/plans/2026-09-22-buchungscodes-spec.md` — dieser Plan ersetzt dort Entscheidung E1 für den Normalfall und baut auf Plan 2 auf (siehe „Verhältnis zu Plan 1 und 2").

**Voraussetzung:** Plan 0 ist abgeschlossen (`docker compose exec web pytest` grün). Plan 2 Task 1–2 (Ausnahme statt Kategorie-Klon, HTTP 400) sind vorher oder als Task 4 dieses Plans umgesetzt.

**Stand:** 2026-10-23, `develop` @ `5ab7e96`.

---

## 1. Anforderungen

Vorgaben vom 2026-10-23:

- **A1 — Format bleibt `KAT-JNN`.** `J` ist die Endziffer des **Jahres, in dem die Veranstaltung stattfindet** (Startdatum), `NN` zählt je Kategorie und Jahr ab `01`. Beispiel: `BGT-601` gibt es 2006, 2016 und 2026.
- **A2 — Saison = Jahr der Veranstaltung.** Wird 2026 eine Veranstaltung für 2027 angelegt, gehört sie zur Saison 2027.
- **A3 — Automatischer Saisonwechsel am 1. Januar.** Die Saison des neuen Jahres wird aktuell, und alle saisongebundenen Modelle (Guides, Kategorien, Kursthemen, Status, …) werden mitgezogen.
- **A4 — Sichtbarkeit:** Client-API zeigt Veranstaltungen der **aktuellen und nächsten** Saison, das Frontend der **letzten, aktuellen und nächsten**.
- **A5 — Nichts geht verloren.** Alle Veranstaltungen, egal welcher Status, bleiben in der Datenbank und langfristig auffindbar.

## 2. Messwerte (lokale Kopie der Produktions-DB, Stand 2026-10-08)

| Befund | Wert |
|---|---|
| Höchste Zahl öffentlicher Veranstaltungen je Kategorie und Startjahr | **66** (BGT 2018; 2026: BGT 55) — alle 526 Kombinationen < 99 |
| Satelliten (Kurstermine, Anmeldeschlüsse, Vorbesprechungen) über 99 je Kategorie und Startjahr | **11 von 68**, Spitze KT9 2022 mit 495 |
| Öffentliche Veranstaltungen, deren Startjahr ≠ Saison | **69**, davon **44** der Saison 2026 mit Start 2027 |

Folgerung: Für öffentliche Veranstaltungen reichen `01`–`99` pro Jahr bei weitem. Satelliten brauchen mehr — sie erscheinen nie auf der Homepage und werden nur intern verwendet, dürfen also **dreistellige Nummern** bekommen (`KT9-7123`, Kapazität 999 je Jahr, gemessen höchstens 495). Die Jahresziffer bleibt damit auch bei Satelliten immer korrekt; einen Präfix-Überlauf gibt es nicht mehr.

## 3. Ist-Zustand, der sich ändern muss

(Codestellen relativ zu `webtool/`.)

- `serializers/frontend/core.py:98-114` `create_event`: Präfix aus dem Startjahr (schon richtig), **Saison aber vom Aufrufer** — und alle Aufrufer übergeben `get_default_season()`, also die aktuelle Saison: `tours.py:223,281`, `instructions.py:183`, `talks.py:101`, `sessions.py:132`. Ursache der 69 Abweichungen und der Code-Kollisionen über Saisongrenzen.
- `instructions.py:206`: neue Kurstermine holen die Saison über `instance.topic.seasons.get(current=True)` — wirft `DoesNotExist`, wenn das Thema nicht in der aktuellen Saison ist.
- `models/reference.py` `find_free_references`: rollt bei 99 belegten Nummern in die nächste Präfixziffer — für öffentliche Kategorien künftig falsch (Jahresziffer stimmt dann nicht mehr).
- `update_seasons` verknüpft **alle** Zeilen (auch gelöschte) mit einer Saison, legt aber weder Saison noch Kalender an, setzt `current` nicht und lässt `Tariff` (FK) aus. `init_season` ist nur für eine leere Installation (Saison 2018 hart kodiert).
- Kein Zeitplaner im Repo; der Saisonwechsel geschieht heute von Hand.
- Client-API: `views/client/activity.py:19` `season__current=True`; `collective.py:19`, `guide.py:17`, `topic.py:17` `seasons__current=True`; Auflösung per `Reference.get_reference` nur in der aktuellen Saison.
- Frontend-API: `views/frontend/tours.py:46-51`, `instructions.py:52-57` filtern `start_date >= 1.1. Vorjahr`, berechnet **beim Import** (veraltet nach dem Jahreswechsel bis zum Neustart); `sessions.py`, `talks.py` ohne Zeitfenster; `tourcalendar.py:13`, `instructioncalendar.py:13`, `names.py:14`, `values.py:190` nur aktuelle Saison.
- `management/commands/timer_update.py`: setzt vergangene Veranstaltungen auf „Durchgeführt", aber nur in der aktuellen Saison — nach dem Wechsel blieben die Dezember-Veranstaltungen des Vorjahres hängen.
- Partieller Unique-Index `server_season("current") WHERE "current"` (Migration 0002): beim Wechsel erst alte Saison abwählen, dann neue setzen, in einer Transaktion.

## 4. Entscheidungen

**E3-1 — Saison eines Events = Saison seines Startjahres.** Satelliten (Anmeldeschluss, Vorbesprechung, Kurstermine) gehören zur Saison ihres Hauptevents, auch wenn ihr eigenes Datum im Vorjahr liegt (Anmeldeschluss im Dezember für eine Januar-Tour). So bleiben Tour und Satelliten immer in einer Saison.

**E3-2 — Saisons entstehen bei Bedarf.** `Season.for_year(year)` legt eine fehlende Saison an — inklusive Kalender, Verknüpfungen und Tarife, kopiert von der neuesten vorhandenen Saison. Aufgerufen von `create_event` (Veranstaltung im nächsten Jahr) und vom Saisonwechsel. Idempotent.

**E3-3 — Mitziehen heißt: Verknüpfungen der Vorsaison übernehmen,** nicht `.all()` wie `update_seasons`. Was in der Vorsaison abgewählt war (z. B. auslaufende Kategorie), bleibt draußen; nichts Gelöschtes wird wiederbelebt. `Tariff` (FK) wird je Name kopiert.

**E3-4 — Die Präfixziffer ist immer die Jahresziffer, kein Überlauf mehr.**
Öffentliche Kategorien vergeben `01`–`99`; sind sie belegt, wirft
`create_reference` `ReferenceSpaceExhausted` (Plan 2) → HTTP 400. Satelliten-
Kategorien (Flags `deadline`, `preliminary`, `meeting`, z. B. `AS…`, `KT…`) vergeben
`01`–`999`, ab 100 also dreistellig (`KT9-7123`). Das Speicherschema bleibt: `prefix`
0–9, `reference` als `PositiveSmallIntegerField`, nur der Validator geht für
Satelliten auf 999 (Migration ohne SQL). `__str__` braucht keine Änderung —
`"{:02d}".format(123)` ist schon `"123"`; die Darstellung ist eindeutig, weil
Nummern unter 100 immer zweistellig erscheinen. Anpassen muss sich nur das
Zerlegen (`-(\d)(\d{2,3})$` statt `-(\d)(\d{2})`), sonst würde `KT9-7123` als
Nummer 12 gelesen.

**E3-5 — Saisonwechsel per täglichem Kommando** `rollover_season`, auf dem Server per Cron um 00:05 gestartet. Idempotent und an jedem Tag gefahrlos; am 1. Januar wechselt es. Zusätzlich setzt es die Saison des Folgejahres an (E3-2), damit Veranstaltungen fürs nächste Jahr jederzeit angelegt werden können.

**E3-6 — Sichtbarkeitsfenster als eine Funktion.** `visible_seasons(kind)` liefert für `client` {aktuell, nächste}, für `frontend` {letzte, aktuell, nächste} — berechnet pro Anfrage, nicht beim Import.

**E3-7 — Auflösung blanker Codes über die Jahresziffer.** `BGT-612` → Präfix 6 → unter den sichtbaren Saisons (Client: aktuell + nächste, D2) die, deren Jahr auf 6 endet. Gibt es dort keinen Treffer, gilt das alte Verhalten (Suche in der aktuellen Saison) — für Altcodes, deren Präfix nicht zur Saison passt. Satelliten werden nie öffentlich aufgelöst.

**E3-8 — Bestandsdaten:** einmaliges Kommando `realign_seasons` (Probelauf als Standard) verschiebt Veranstaltungen, deren Startjahr nicht ihrer Saison entspricht, samt Satelliten und Buchungscode-Zeile in die Saison ihres Jahres — **der Code-String bleibt dabei unverändert** (Präfix war schon das Startjahr). Bei einer Kollision in der Zielsaison wird die Veranstaltung übersprungen und gemeldet.

### Entschieden am 2026-10-23

- **D1 — Startdatum wird nachträglich in ein anderes Jahr verschoben:** Solange
  der Status „In Arbeit" oder „Fertig" ist, wechselt die Veranstaltung Saison
  **und Buchungscode** (samt Satelliten). Ab „Freigegeben" bleiben beide — der
  Code kann schon gedruckt sein; die Abweichung Startjahr ≠ Saison wird im Admin
  sichtbar gemacht.
- **D2 — Keine älteren Saisons über die Client-API.** Die Client-API liefert
  ausschließlich aktuelle und nächste Saison, auch für Einzelabrufe. Die
  saisonbehaftete Route aus Plan 1 Task 3 entfällt. Langfristig auffindbar (A5)
  bleiben Veranstaltungen über Datenbank, Admin und Frontend-API.
- **D3 — Stammdaten im Formular (`/api/frontend/values/`):** Vereinigung über das
  Frontend-Fenster (distinct), damit beim Bearbeiten einer Vorjahres-Veranstaltung
  auch ein inzwischen abgewähltes Thema angezeigt wird.

## 5. Verhältnis zu Plan 1 und 2

- **Plan 2:** Task 1–2 (Klon entfernen, HTTP 400) sind Voraussetzung; Task 3 (`check_reference_space`) wird übernommen, mit der Kapazität **je Jahr**: 99 für öffentliche, 999 für Satelliten-Kategorien statt pauschal 990.
- **Plan 1:** Task 1 (`parse_code`, `seasons_for`) und Task 4 (Feld `season` in der Antwort) werden übernommen; `parse_code` mit dem Muster aus E3-4. Task 2 (`public_events`) wird zu `public_events(seasons)` mit dem Fenster aus E3-6. **Task 3 (saisonbehaftete Route) entfällt** (D2).
- **Spec Entscheidung E3 („Kein Daten-Backfill")** gilt weiter für Buchungscodes: kein Code-String ändert sich. `realign_seasons` (E3-8) verschiebt nur die Saisonzugehörigkeit.

## Global Constraints

- Spec Abschnitt 6 gilt.
- Tests: `docker compose exec web pytest`; neue Fixtures in `webtool/server/tests/conftest.py`.
- `webtool/server/migrations/0002_constraints.py` nicht anfassen.
- Keine Code-Strings bestehender Veranstaltungen ändern.
- Kommentare dürfen deutsch sein, Code, Testnamen und Commits englisch.

## File Structure

| Datei | Änderung | Verantwortung |
|---|---|---|
| `server/models/season.py` | ändern | `Season.for_year(year)`, `Season.visible(kind)` |
| `server/models/category.py` | ändern | `Category.is_satellite` (Anmeldeschluss, Vorbesprechung, Kurstermin) |
| `server/models/reference.py` | ändern | kein Präfix-Überlauf, dreistellige Nummern für Satelliten, Auflösung über Jahresziffer |
| `server/serializers/frontend/core.py` | ändern | `create_event`: Saison aus dem Startjahr |
| `server/serializers/frontend/{tours,instructions,talks,sessions}.py` | ändern | Saison nicht mehr vorgeben; Satelliten erben die Saison |
| `server/management/commands/rollover_season.py` | neu | täglicher Saisonwechsel |
| `server/management/commands/realign_seasons.py` | neu | Bestandsdaten einmalig angleichen |
| `server/management/commands/timer_update.py` | ändern | Fenster statt nur aktueller Saison |
| `server/views/client/{activity,collective,guide,topic}.py` | ändern | Fenster {aktuell, nächste} |
| `server/views/frontend/{tours,instructions,talks,sessions,tourcalendar,instructioncalendar,names,values}.py` | ändern | Fenster {letzte, aktuell, nächste} |
| `server/tests/conftest.py` | ändern | Fixtures `seasons_window`, `freeze_today` |
| `server/tests/test_season_*.py`, `test_reference_year.py`, `test_visibility.py` | neu | Tests je Task |
| `docs/DATENBANK-IMPORT.md` oder neue Betriebsdoku | ändern | Cron-Eintrag, `realign_seasons` beim Deployment |

---

### Task 1: Saisons bei Bedarf anlegen und Stammdaten mitziehen

**Files:** `server/models/season.py`, Test `server/tests/test_season_for_year.py`

**Interfaces:**
- Produces: `Season.for_year(year: int) -> Season` — idempotent; legt fehlende Saison an mit Kalender, M2M-Verknüpfungen und Tarifen aus der **neuesten Saison mit kleinerem Jahr** (Fallback: neueste vorhandene). Setzt `current` **nicht**.

- [ ] **Step 1: Tests schreiben**
  - `test_for_year_returns_an_existing_season_unchanged`
  - `test_for_year_creates_season_and_calendar`
  - `test_for_year_copies_m2m_links_of_the_previous_season` — für alle elf M2M-Modelle (Approximate, Category, CategoryGroup, Collective, Equipment, Fitness, Guide, Topic, Part, Skill, State): verknüpft in 2026 → auch in 2027.
  - `test_for_year_does_not_revive_rows_unlinked_from_the_previous_season` — Kategorie nur in 2025, nicht in 2026 → nicht in 2027.
  - `test_for_year_copies_tariffs_by_name`
  - `test_for_year_is_idempotent` — zweiter Aufruf erzeugt nichts doppelt.
  - `test_for_year_never_changes_the_current_flag`
- [ ] **Step 2: Fehlschlag bestätigen**
- [ ] **Step 3: Implementieren.** In `transaction.atomic()`; M2M über die Reverse-Relationen der Vorsaison (`source.category_list.all()` usw.) per `.seasons.add(target)`; Kalender wie `init_calendar` (Startdatum 1.1.). Die Modell-Liste als Konstante `SEASON_LINKED_MODELS`, damit Task 2 und Tests sie teilen.
- [ ] **Step 4: Erfolg bestätigen, Gesamtlauf**
- [ ] **Step 5: Commit** `feat: create missing seasons on demand with links copied from the previous one`

### Task 2: Automatischer Saisonwechsel

**Files:** `server/management/commands/rollover_season.py`, Test `server/tests/test_season_rollover.py`

**Interfaces:**
- Consumes: `Season.for_year`
- Produces: Kommando `rollover_season [--today YYYY-MM-DD]` (`--today` nur für Tests und Probeläufe)

- [ ] **Step 1: Tests schreiben**
  - `test_rollover_on_new_year_makes_the_new_year_current` — current 2026, today 2027-01-01 → current 2027.
  - `test_rollover_also_prepares_the_following_season` — danach existiert 2028.
  - `test_rollover_within_the_year_changes_nothing` — today 2026-06-15, current 2026 → keine Änderung außer 2027 anlegen, falls fehlend.
  - `test_rollover_is_idempotent` — zweimal am 1.1. → genau eine aktuelle Saison.
  - `test_rollover_respects_the_single_current_index` — kein `IntegrityError` (erst abwählen, dann setzen, eine Transaktion).
- [ ] **Step 2: Fehlschlag bestätigen**
- [ ] **Step 3: Implementieren.** `target = Season.for_year(today.year)`; `Season.for_year(today.year + 1)`; wenn `target` nicht aktuell: `Season.objects.filter(current=True).update(current=False)`, dann `target.current = True; target.save()`. Ausgabe einer Zeile pro Aktion, damit das Cron-Log aussagekräftig ist.
- [ ] **Step 4: Erfolg bestätigen**
- [ ] **Step 5: Commit** `feat: add rollover_season to switch the current season on 1 January`

**Betrieb (nach dem Merge):** Cron für `djcode` auf dem Server, Umgebung wie für `manage.py` (siehe Memory/Betriebsdoku):

```
5 0 * * * cd ~/WebTool3/webtool && eval "$(grep '^env = ' /etc/uwsgi/sites/client_api.ini | sed "s/^env = \(.*\)$/export '\1'/")" && ~/WebTool3/venv312/bin/python manage.py rollover_season >> ~/logs/rollover_season.log 2>&1
```

### Task 3: Veranstaltungen der Saison ihres Jahres zuordnen

**Files:** `server/serializers/frontend/core.py`, `tours.py`, `instructions.py`, `talks.py`, `sessions.py`, Test `server/tests/test_event_season.py`

**Interfaces:**
- Consumes: `Season.for_year`
- Produces: `create_event` bestimmt die Saison selbst: Hauptevent → `Season.for_year(start_date.year)`; Satellit → Saison des übergebenen Hauptevents (Kontextschlüssel `parent_season`).

- [ ] **Step 1: Tests schreiben** (über die echten Serializer, mit Fixtures für Kategorie/Thema/Status)
  - `test_a_tour_in_next_year_lands_in_next_season` — current 2026, Start 2027-02-01 → Saison 2027, Code `XXX-701`.
  - `test_numbering_restarts_at_01_each_year` — erste Tour 2027 → `-701`, zweite → `-702`; parallel 2026 → `-601`.
  - `test_satellites_follow_the_main_event_season` — Anmeldeschluss 2026-12-15 einer Tour 2027-01-10 → Saison 2027.
  - `test_new_course_meeting_uses_the_course_season` (ersetzt `topic.seasons.get(current=True)`, `instructions.py:206`).
  - `test_a_preliminary_added_later_uses_the_tour_season` (`tours.py:281`).
  - D1: `test_moving_the_start_date_to_another_year_while_in_work_rekeys_the_event` — Status „In Arbeit", Start von 2026-12-20 auf 2027-01-10 → Saison 2027, neuer Code `XXX-7NN`, Satelliten mit umgezogen.
  - D1: `test_moving_the_start_date_keeps_season_and_code_once_released` — Status „Freigegeben" → Saison und Code unverändert.
- [ ] **Step 2: Fehlschlag bestätigen**
- [ ] **Step 3: Implementieren.** In den vier Serializern `season = get_default_season()` entfernen; `create_event` leitet ab. Präfix bleibt `str(start_date.year)[-1]` und ist damit immer gleich der Saisonziffer.
- [ ] **Step 4: Erfolg bestätigen, Gesamtlauf**
- [ ] **Step 5: Commit** `feat: assign events to the season of their start year`

### Task 4: Präfix bleibt die Jahresziffer — dreistellige Nummern für Satelliten

**Files:** `server/models/category.py`, `server/models/reference.py`, Migration (nur Validator), Test `server/tests/test_reference_year.py`

**Voraussetzung:** Plan 2 Task 1–2 (`ReferenceSpaceExhausted`, HTTP 400).

**Interfaces:**
- Produces:
  - `Category.is_satellite -> bool` — wahr bei den Flags `deadline`, `preliminary` oder `meeting`
  - `reference_range(category) -> range` — `1..99` öffentlich, `1..999` Satellit
  - `find_free_references` ohne Präfix-Wechsel: sucht nur in der übergebenen Jahresziffer
  - `Reference.parse_code` / `get_reference` mit dem Muster `-(\d)(\d{2,3})$`

- [ ] **Step 1: Tests schreiben**
  - `test_a_public_category_never_leaves_its_year_digit` — 99 Nummern mit Präfix 7 belegt → `ReferenceSpaceExhausted`, kein `-8xx`.
  - `test_a_satellite_category_continues_with_three_digits` — KT9 mit `01`–`99` in Präfix 7 belegt → nächster Code `KT9-7100`, gleiche Saison, gleiche Jahresziffer.
  - `test_a_satellite_category_is_exhausted_after_999`
  - `test_the_lowest_free_number_is_used` — Lücke bei `-705` wird gefüllt.
  - `test_parse_code_reads_three_digit_numbers` — `'KT9-7123'` → `('KT9', 7, 123)`, `'BGT-712'` → `('BGT', 7, 12)`.
  - `test_three_digit_codes_render_and_resolve_round_trip` — `str(ref)` und `get_reference(str(ref))` ergeben dieselbe Zeile.
- [ ] **Step 2–4:** Fehlschlag, implementieren, Erfolg. Validator von `reference` auf `MaxValueValidator(999)`; `makemigrations` erzeugt ein `AlterField` ohne SQL (mit `sqlmigrate` prüfen).
- [ ] **Step 5: Commit** `fix: keep booking codes on their year digit, three-digit numbers for satellites`

`Booklet` speichert Codes als Text mit `max_length=7` — dort stehen nur öffentliche Codes (`BGT-712`, 7 Zeichen), Satelliten-Codes kommen nicht vor. Keine Änderung nötig; ein Test in Task 4 sichert ab, dass öffentliche Codes nie länger als 7 Zeichen werden.

### Task 5: Blanke Codes über die Jahresziffer auflösen

**Files:** `server/models/reference.py`, `server/views/client/activity.py`, Test `server/tests/test_reference_resolution.py`

**Interfaces:**
- Consumes: `Season.visible('client')` aus Task 6 (oder vorher als einfache Funktion)
- Produces: `Reference.get_reference(value, season=None, seasons=None)` — mit `seasons`: Kandidat ist die Saison aus `seasons`, deren Jahr auf die Präfixziffer endet; sonst Rückfall wie bisher.

- [ ] **Step 1: Tests schreiben**
  - `test_a_code_resolves_to_the_season_of_its_year_digit` — current 2026, `BGT-701` existiert in 2027 → 2027.
  - `test_a_code_of_this_year_still_resolves` — `BGT-612` in 2026.
  - `test_ten_years_later_the_newer_season_wins` — `BGT-612` in 2016 und 2026, Fenster {2026, 2027} → 2026.
  - `test_a_legacy_code_with_a_foreign_prefix_falls_back_to_the_current_season` — `BGT-712` in Saison 2026 (Altbestand) → gefunden.
  - `test_the_bare_route_uses_the_year_digit` — `/api/client/activities/BGT-701/` liefert die 2027er Tour.
- [ ] **Step 2–4:** Fehlschlag, implementieren, Erfolg
- [ ] **Step 5: Commit** `feat: resolve bare booking codes through their year digit`

### Task 6: Sichtbarkeitsfenster in Client-API und Frontend

**Files:** `server/models/season.py`, Client- und Frontend-Views (siehe File Structure), `management/commands/timer_update.py`, Test `server/tests/test_visibility.py`

**Interfaces:**
- Produces: `Season.visible(kind) -> QuerySet[Season]` — `client`: {aktuell, aktuell+1}; `frontend`: {aktuell−1, aktuell, aktuell+1}; nur vorhandene Saisons; pro Aufruf berechnet.

- [ ] **Step 1: Tests schreiben**
  - `test_client_activities_list_this_and_next_season` — Events 2025/2026/2027, current 2026 → 2026 + 2027.
  - `test_frontend_tours_list_last_this_and_next_season` — Events 2024–2027, current 2026 → 2025–2027. Ebenso Kurse, Vorträge, Gruppentermine.
  - `test_frontend_window_follows_the_year_without_restart` — Fenster nach Wechsel der aktuellen Saison ohne Neuimport (ersetzt die beim Import berechneten `requested_year`).
  - `test_client_guides_topics_collectives_use_the_client_window`
  - `test_values_cover_the_frontend_window` (D3) — ein nur in der Vorsaison verknüpftes Thema erscheint, keine Duplikate.
  - `test_client_detail_outside_the_window_is_404` (D2) — Code einer Veranstaltung von 2025, current 2026 → 404.
  - `test_timer_update_completes_last_seasons_events_after_rollover` — Tour 2026-12-30, Wechsel auf 2027, `timer_update` am 2027-01-02 → „Durchgeführt".
- [ ] **Step 2–4:** Fehlschlag, implementieren, Erfolg. Plan 1 Task 2 (`public_events`) hier mit `seasons=Season.visible('client')` umsetzen.
- [ ] **Step 5: Commit** `feat: show a window of seasons in the client API and the frontend`

### Task 7: Bestandsdaten angleichen

**Files:** `server/management/commands/realign_seasons.py`, Test `server/tests/test_realign_seasons.py`

**Interfaces:**
- Produces: Kommando `realign_seasons [--apply]` — ohne `--apply` nur Bericht.

- [ ] **Step 1: Tests schreiben**
  - `test_dry_run_reports_and_changes_nothing`
  - `test_apply_moves_event_satellites_and_reference_to_the_year_season` — Tour 2027 in Saison 2026 → Event, Reference, Anmeldeschluss, Vorbesprechung in 2027; **`str(reference)` unverändert**.
  - `test_apply_skips_and_reports_a_code_collision`
  - `test_apply_creates_the_target_season_if_missing` (über `Season.for_year`)
- [ ] **Step 2–4:** Fehlschlag, implementieren, Erfolg
- [ ] **Step 5: Commit** `feat: add realign_seasons to move events into the season of their year`

**Deployment:** Nach dem Deploy auf dem Server erst ohne `--apply` laufen lassen (erwartet: ~44 Veranstaltungen der Saison 2026 mit Start 2027), Bericht prüfen, dann mit `--apply`. Vorher Backup nach `~/backups/`.

---

## Nach dem Plan

- Cron für `rollover_season` auf dem Server einrichten (Task 2) und am 2. Januar das Log prüfen.
- `check_reference_space` (Plan 2 Task 3) mit Kapazität je Jahr (99 öffentlich, 999 Satelliten) regelmäßig laufen lassen.
- Homepage/TYPO3: keine Änderung nötig — sie nutzt weiter blanke Codes (Task 5), saisonfeste Links gibt es nicht (D2).
- `update_seasons` und `init_season` bleiben für Sonderfälle; die Doku (CLAUDE.md) verweist künftig auf `rollover_season`.
