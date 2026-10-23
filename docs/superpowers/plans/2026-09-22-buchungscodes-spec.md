# Spec: Buchungscodes — Saisonsicherheit und Namensraum-Erschöpfung

**Stand:** 2026-09-22 · **Repo:** WebTool3 · **Branch-Basis:** `develop` @ `fe5953b`

Dieses Dokument ist die Grundlage für zwei getrennte Pläne. Es ist bewusst
selbsttragend: alle Befunde, Zahlen und Codestellen stehen hier, damit auf einer
anderen Maschine ohne den ursprünglichen Gesprächsverlauf gearbeitet werden kann.

---

## 1. Wie Buchungscodes funktionieren

Ein Buchungscode hat die Form `KATEGORIE-PNN`, z. B. `BGT-012`:

| Teil | Quelle | Grenze |
|---|---|---|
| `KATEGORIE` | `Category.code` | `CharField(max_length=3, unique=True)` |
| `P` (Prefix) | `Reference.prefix` | `PositiveSmallIntegerField`, `MaxValueValidator(9)` |
| `NN` (Referenz) | `Reference.reference` | `PositiveSmallIntegerField`, `MaxValueValidator(99)` |

Gerendert in `Reference.__str__` als `"{}-{}{:02d}"`.

Eindeutigkeit ist **pro Saison** definiert:

    # webtool/server/models/reference.py
    class Meta:
        unique_together = ('season', 'category', 'prefix', 'reference')

`Reference` erbt `SeasonMixin`, also einen **ForeignKey** `season` (related_name
`reference_list`). Der Code-String selbst war nie global eindeutig — das ist
Absicht im Schema, nicht ein Versehen.

### Das Prefix ist kein Jahresmarker

Verbreitete Fehlannahme: das Prefix sei die Endziffer des Jahres, ein Code
wiederhole sich also alle 10 Jahre. Tatsächlich ist das Prefix nur der
*Startwert*. `find_free_references` rollt weiter, sobald die 99 Plätze eines
Prefixes belegt sind:

    # webtool/server/models/reference.py
    REFERENCE_RANGE = set(range(1, 100))   # 1..99, die 0 wird nie vergeben
    ...
    prefix_idx = (prefix_idx + 1) % 10
    if int(prefix) == prefix_idx:
        reference = None      # alle 10 Prefixe voll
        break

Zusätzlich leitet `create_event` das Start-Prefix aus dem **Startdatum** ab,
nicht aus der Saison:

    # webtool/server/serializers/frontend/core.py
    reference = Reference.create_reference(
        category=category,
        prefix=str(start_date.year)[-1] if start_date else season.name[-1],
        season=season, **event_type)

**Kapazität pro (Saison, Kategorie): 10 Prefixe × 99 Referenzen = 990.**

---

## 2. Gemessener Ist-Zustand

Datenquelle: lokale Kopie der Produktionsdatenbank, Saisons 2018–2025,
8370 `Reference`-Zeilen, 138 Kategorien, 492 (Saison, Kategorie)-Paare.
Produktion enthält zusätzlich 2026; an den Strukturaussagen ändert das nichts,
weil `reference.py` und `category.py` zwischen `fe5953b` und Produktion
byte-identisch sind.

### 2.1 Auslastung

| Saison | Kategorie | belegt | von 990 | genutzte Prefixe |
|---|---|---|---|---|
| 2023 | KT9 (Kurstermin) | 663 | 67,0 % | 2,3,4,5,6,7,8,9 |
| 2022 | KT9 | 494 | 49,9 % | 1–7 |
| 2023 | AS5 (Anmeldeschluss) | 234 | 23,6 % | 1–5 |
| 2025 | AS5 | 215 | 21,7 % | 3–7 |
| 2024 | KT9 | 186 | 18,8 % | 3–6 |

67 von 492 (Saison, Kategorie)-Paaren haben bereits einen Prefix-Rollover.

### 2.2 Wiederverwendung von Code-Strings

541 von 7466 verschiedenen Code-Strings (7,2 %) existieren in mehr als einer
Saison. Die Abstände sind **1 und 2 Jahre** — 10 kommt in den Daten nicht vor.

| Saison | Codes, die es im Vorjahr schon gab |
|---|---|
| 2022 | 4 von 1175 (0,3 %) |
| 2023 | **428 von 1427 (30,0 %)** |
| 2024 | **240 von 701 (34,2 %)** |
| 2025 | 81 von 902 (9,0 %) |

### 2.3 Der Überlauf-Pfad ist für 136 von 138 Kategorien kaputt

Sind alle 990 Plätze belegt, klont `create_reference` die Kategorie mit
hochgezählter Endziffer:

    category_index = category_code[-1]
    if category_index < "0" or category_index > "9":
        raise Category.DoesNotExist("Reference matching query does not exist.")
    category.pk = None
    category_index = int(category_index) + 1
    category.code = "{}{:1d}".format(category_code[:2], category_index)
    category.save()

| Fall | Ergebnis | Anzahl |
|---|---|---|
| Code endet nicht auf Ziffer (`BGT`, `AAK`, `ABS` …) | `Category.DoesNotExist` mit irreführendem Text | **118** |
| `KT9` → `"KT"+"10"` = `KT10`, 4 Zeichen | `DataError: value too long for character varying(3)` | **1** |
| `+1` bereits vergeben (`AS0→AS1`, `KT3→KT4` …) | `IntegrityError` (`code` ist `unique`) | **17** |
| würde funktionieren | | **2** |

Alle drei Fehler schlagen ungefangen bis `create_event` durch, also **HTTP 500
beim Anlegen einer Veranstaltung**. Die vollste Kategorie (`KT9`, 67 %) ist
ausgerechnet die eine, deren Klon an der Feldlänge scheitert.

---

## 3. Die zwei Probleme

### P1 — Auflösung ist an die aktuelle Saison genagelt

Beide öffentlichen Einstiegspunkte rufen `get_reference` **ohne** Saison auf und
fallen damit auf `Season.objects.get(current=True)` zurück:

- `webtool/server/views/client/activity.py`, `ActivityViewSet.get_object()`
- `webtool/server/serializers/client/booklet.py`, `validate_references()`

Zusätzlich ist das Listen-Queryset auf `season__current=True` gepinnt.

Folge für einen gedruckten Code aus einer vergangenen Saison:

- Code in der aktuellen Saison **nicht** vergeben → HTTP 404. Sichtbar, harmlos.
- Code in der aktuellen Saison **erneut** vergeben → es wird klaglos eine
  **andere Veranstaltung** ausgeliefert. Das betraf 2023 und 2024 rund ein
  Drittel aller Codes.

Der zweite Fall ist der eigentliche Schaden: still, nicht diagnostizierbar,
betrifft alles Gedruckte mit Buchungscode.

### P2 — Namensraum-Erschöpfung endet im 500er

Siehe 2.3. Der vorgesehene Ausweg funktioniert praktisch nie und erzeugt als
Nebenwirkung neue, für Nutzer sichtbare Kategorie-Codes aus einem rein internen
Zähler.

---

## 4. Entscheidungen

**E1 — Die Saison muss in den Link, nicht in eine Heuristik.**
Ein blanker Code ist objektiv mehrdeutig; keine Auflösungsregel kann das
reparieren. Es kommt eine zusätzliche, saisonbehaftete Detail-Route dazu. Die
bestehende Route bleibt unverändert (aktuelle Saison), damit vorhandene Links
weiter funktionieren.

**E2 — Der Kategorie-Klon wird entfernt, nicht repariert.**
Begründung: er ist in 136 von 138 Fällen ein 500er statt eines Auswegs; er
erzeugt nutzersichtbare Codes aus einem internen Zähler; und ihn zu reparieren
hieße `Category.code` zu verbreitern, was auf Druckerzeugnisse durchschlägt.
Stattdessen eine klare, gefangene Fehlermeldung (HTTP 400) plus ein Kommando,
mit dem man das Volllaufen kommen sieht.

**E3 — Kein Daten-Backfill.**
Bestehende `Reference`-Zeilen werden nicht umnummeriert. Das würde gedruckte
Codes ungültig machen.

## 5. Nicht-Ziele

- `booklet.py::validate_references` bleibt bei der aktuellen Saison. Es ist ein
  Staff-Werkzeug, in das Codes der laufenden Saison eingegeben werden; die
  Saisonangabe dort ist ein eigenes Thema.
- Die 990-Grenze selbst wird nicht angehoben.
- Frontend/Angular wird nicht angefasst.

---

## 6. Globale Randbedingungen

Gelten für **alle** Tasks in allen drei Plänen.

- Python **>= 3.12**, Django **6.0.5**, PostgreSQL **17**
- Paketverwaltung `uv`, Konfiguration in `pyproject.toml`
- Tests: **pytest + pytest-django**, in `pyproject.toml` bereits konfiguriert,
  aber nie aufgesetzt — siehe Plan 0
- Settings-Modul für Tests: `config.settings.test` (**existiert noch nicht**)
- Testverzeichnis: `webtool/server/tests/` (**existiert noch nicht**)
- `manage.py` liegt in `webtool/`, dieses Verzeichnis ist via
  `pythonpath = ["webtool"]` auf dem Importpfad
- Kommentar-Prosa darf deutsch sein; Code, Testnamen und Commit-Messages
  englisch, wie im bestehenden Repo
- `webtool/server/migrations/0002_constraints.py` enthält rohe SQL-Constraints,
  u. a. `CREATE UNIQUE INDEX ON "server_season" ("current") WHERE "current"`.
  Nicht anfassen.

## 7. Reihenfolge

1. **Plan 0** — Testinfrastruktur aufsetzen (Voraussetzung für 1 und 2)
2. **Plan 1** — Saisonsichere Auflösung (behebt P1)
3. **Plan 2** — Namensraum-Erschöpfung (behebt P2)

Plan 1 und Plan 2 sind untereinander unabhängig und können in beliebiger
Reihenfolge oder parallel bearbeitet werden.
