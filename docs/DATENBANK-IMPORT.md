# SQL-Datenbank in den `db`-Container einbinden

Anleitung für das lokale Docker-Setup unter Windows (PowerShell). Bezieht sich auf den
`db`-Service aus [docker-compose.yml](../docker-compose.yml) (`postgres:17`).

## Ausgangslage

| | Wert |
|---|---|
| Containername | `webtool3-db-1` |
| Image | `postgres:17` |
| Datenbank | `webtool` |
| Benutzer | `djcode` |
| Passwort | aus `.env` → `DJCODE_DB_PASSWORD` |
| Port (Host) | `localhost:5432` |
| Daten-Volume | `webtool3_postgres_data` |

Die Daten liegen im **Named Volume**, nicht im Projektordner. Das Volume überlebt
`docker compose down`; erst `docker compose down -v` löscht es.

---

## Aktuellen Stand vom Produktionsserver holen

Der schnellste Weg zu realistischen Daten. Voraussetzung ist der ssh-Zugang `webtool`
(Eintrag in `~/.ssh/config`, Benutzer `djcode`).

| | Server |
|---|---|
| Host | `webtool.dav-kempten.de` |
| Cluster der Anwendung | **Postgres 17**, Port 5432 (per Unix-Socket) |
| Weitere Cluster | 16 (Port 5433), 9.6 (Port 5434) — **nicht** von der Anwendung genutzt |
| Datenbank / Benutzer | `webtool` / `djcode`, per Socket ohne Passwort |

> **Wichtig:** Auf dem Server sind Client-Programme mehrerer Postgres-Versionen
> installiert (`psql` im `PATH` ist bereits Version 18). Ein Custom-Format-Dump von
> `pg_dump` 18 kann das lokale `pg_restore` 17 nicht lesen. Deshalb den vollen Pfad zur
> 17er-Version verwenden, statt sich auf den `PATH` zu verlassen.

### 1. Dump auf dem Server erzeugen und holen

```bash
ssh webtool "umask 077 && /usr/lib/postgresql/17/bin/pg_dump -w -d webtool -Fc --no-owner --no-privileges -f ~/webtool.dump"
```

```bash
scp webtool:webtool.dump ..\webtool-prod.dump
```

```bash
ssh webtool "rm ~/webtool.dump"
```

- Der Dump landet **neben** dem Repo (`..\`), nicht darin: Er enthält echte
  Personendaten (Trainer, Benutzerkonten) und gehört nicht ins Git.
- `umask 077` sorgt dafür, dass die Datei auf dem Server nur für `djcode` lesbar ist,
  solange sie dort liegt.

> **Windows-Fallstrick:** Nicht `ssh webtool "pg_dump ..." > datei` verwenden. Die
> `>`-Umleitung in PowerShell 5.1 kodiert die Ausgabe als UTF-16-Text und macht den
> Binär-Dump unbrauchbar. In Git Bash würde das funktionieren, `scp` funktioniert überall.

### 2. Lokal einspielen

Ersetzt die lokale Datenbank **komplett**:

```bash
docker compose stop web
```

```bash
docker cp ..\webtool-prod.dump webtool3-db-1:/tmp/prod.dump
```

```bash
docker compose exec db psql -U djcode -d postgres -c "DROP DATABASE IF EXISTS webtool;" -c "CREATE DATABASE webtool OWNER djcode;"
```

```bash
docker compose exec db pg_restore -U djcode -d webtool --no-owner --no-privileges --exit-on-error /tmp/prod.dump
```

```bash
docker compose exec db rm /tmp/prod.dump
```

```bash
docker compose start web
```

Danach den Migrationsstand prüfen (siehe [Nach dem Import](#nach-dem-import-django-migrationsstand)).
Ist `develop` weiter als der Server, holt `migrate` die neuen Migrationen nach.

Die Benutzerkonten stammen aus der Produktion. Zum Anmelden in der lokalen App also
die echten Zugangsdaten verwenden oder einen lokalen Admin anlegen:

```bash
docker compose exec web python webtool/manage.py createsuperuser
```

---

## Variante A — Dump in die laufende Datenbank importieren

Der übliche Weg, wenn du einen Dump aus der Produktion o. ä. hast.

> **Windows-Fallstrick:** In PowerShell 5.1 gibt es **keine** Eingabe-Umleitung mit `<`.
> Das unter Linux übliche `docker compose exec -T db psql ... < dump.sql` ist hier ein
> Parser-Fehler. Ausserdem verfälscht `Get-Content | docker ...` bei UTF-8-Dumps
> (Umlaute!) die Kodierung. Deshalb: erst `docker cp`, dann im Container importieren.

### 1. Dump in den Container kopieren

```bash
docker cp .\dump.sql webtool3-db-1:/tmp/dump.sql
```

### 2. Datenbank leeren und neu anlegen

Ein Dump wird in eine leere Datenbank eingespielt. Die Verbindung läuft über die
Wartungsdatenbank `postgres`, weil `webtool` dabei gelöscht wird:

```bash
docker compose exec db psql -U djcode -d postgres -c "DROP DATABASE IF EXISTS webtool;" -c "CREATE DATABASE webtool OWNER djcode;"
```

Falls die Meldung *"database is being accessed by other users"* kommt, vorher den
Django-Container stoppen: `docker compose stop web`.

### 3. Importieren

```bash
docker compose exec db psql -U djcode -d webtool -v ON_ERROR_STOP=1 -f /tmp/dump.sql
```

`ON_ERROR_STOP=1` bricht beim ersten Fehler ab — ohne diesen Schalter läuft `psql`
über Fehler hinweg und du bekommst am Ende eine halb gefüllte Datenbank.

### 4. Aufräumen und prüfen

```bash
docker compose exec db rm /tmp/dump.sql
```

```bash
docker compose exec db psql -U djcode -d webtool -c "\dt server_*"
```

---

## Variante B — Custom-Format-Dump (`.dump` / `.backup`)

Dumps aus `pg_dump -Fc` sind Binärdateien und brauchen `pg_restore`:

```bash
docker cp .\dump.backup webtool3-db-1:/tmp/dump.backup
```

```bash
docker compose exec db pg_restore -U djcode -d webtool --clean --if-exists --no-owner --no-privileges /tmp/dump.backup
```

- `--clean --if-exists` — vorhandene Objekte vorher löschen (kein manuelles DROP DATABASE nötig)
- `--no-owner --no-privileges` — ignoriert Rollen aus dem Quellsystem, die es lokal nicht
  gibt; alles gehört danach `djcode`

Unsicher, welches Format vorliegt? Plain-SQL-Dumps beginnen mit lesbarem Text,
Custom-Dumps mit `PGDMP`:

```bash
docker compose exec db head -c 5 /tmp/dump.backup
```

---

## Variante C — Automatischer Import beim ersten Start

Das Postgres-Image führt beim **allerersten** Start alles aus, was in
`/docker-entrypoint-initdb.d/` liegt (`.sql`, `.sql.gz`, `.sh`). Praktisch, wenn das
Setup bei Kolleg:innen reproduzierbar mit Seed-Daten hochkommen soll.

1. Ordner `initdb/` im Projektwurzelverzeichnis anlegen und den Dump dort ablegen
   (z. B. `initdb/01_schema.sql`, `initdb/02_daten.sql` — alphabetische Reihenfolge).
2. In `docker-compose.yml` beim `db`-Service mounten:

```yaml
  db:
    image: postgres:17
    environment:
      POSTGRES_DB: webtool
      POSTGRES_USER: djcode
      POSTGRES_PASSWORD: ${DJCODE_DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./initdb:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
```

3. Damit es greift, muss das Volume leer sein:

```bash
docker compose down -v
```

```bash
docker compose up -d
```

> **Achtung:** `down -v` löscht die lokale Datenbank unwiderruflich. Die Skripte laufen
> **nur** bei leerem Volume — bei bestehenden Daten passiert nichts, ohne Fehlermeldung.
> `.sql`-Dateien sind über `.gitignore` ausgeschlossen; für einen eingecheckten Seed
> müsstest du eine Ausnahme ergänzen (`!initdb/*.sql`).

---

## Backup erstellen

Plain SQL:

```bash
docker compose exec db pg_dump -U djcode -d webtool --no-owner --no-privileges -f /tmp/backup.sql
```

```bash
docker cp webtool3-db-1:/tmp/backup.sql .\backup.sql
```

Komprimiert (empfohlen für grosse Datenbanken):

```bash
docker compose exec db pg_dump -U djcode -d webtool -Fc -f /tmp/backup.dump
```

---

## Mit externem Tool verbinden (DBeaver, PyCharm, pgAdmin)

Port 5432 ist auf den Host gemappt, es ist also keine Docker-Kenntnis nötig:

| Feld | Wert |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Datenbank | `webtool` |
| Benutzer | `djcode` |
| Passwort | siehe `.env` |

Wichtig: **Innerhalb** der Container heisst der Host `db` (so steht es in `DATABASE_URL`),
**vom Windows-Host** aus `localhost`. Läuft lokal bereits ein Postgres auf 5432, kollidiert
das Port-Mapping — dann in `docker-compose.yml` auf z. B. `"5433:5432"` ändern
(die interne Verbindung des `web`-Containers bleibt davon unberührt).

---

## Nach dem Import: Django-Migrationsstand

Ein importierter Dump bringt seinen eigenen Stand der `django_migrations`-Tabelle mit.
Prüfen, ob der Code neuer ist als das Schema:

```bash
docker compose exec web python webtool/manage.py showmigrations server
```

```bash
docker compose exec web python webtool/manage.py migrate
```

Ausserdem nötig, falls im Dump nicht enthalten:

```bash
docker compose exec web python webtool/manage.py createcachetable
```

> **Hinweis:** Meldet `migrate` *"Conflicting migrations detected … (0037_auto_20210830_1122,
> 0050_auto_20250212_2157 in server)"*, liegt lokal noch die nie gepushte Migration
> `0037_auto_20210830_1122.py` herum. Sie ist auf `origin/develop` nicht enthalten und
> überflüssig (`0037_auto_20230511_1944` enthält dieselben Operationen). Datei löschen,
> **keine** Merge-Migration anlegen. Steht sie bereits in der Datenbank, den Eintrag entfernen:
>
> ```bash
> docker compose exec db psql -U djcode -d webtool -c "DELETE FROM django_migrations WHERE app='server' AND name='0037_auto_20210830_1122';"
> ```

---

## Troubleshooting

**`FATAL: password authentication failed for user "djcode"`**
Das Passwort wird nur beim allerersten Start des Volumes gesetzt. Wenn du
`DJCODE_DB_PASSWORD` in `.env` nachträglich änderst, gilt im Volume weiter das alte.
Entweder im Container ändern:

```bash
docker compose exec db psql -U djcode -d postgres -c "ALTER USER djcode WITH PASSWORD 'neuesPasswort';"
```

…oder das Volume neu aufsetzen (`docker compose down -v`).

**Umlaute werden als `Ã¤` importiert**
Der Dump wurde durch eine PowerShell-Pipe geschleust. Immer `docker cp` verwenden
(siehe Variante A) — dabei wird byteweise kopiert.

**`role "postgres" does not exist`**
Der Dump stammt aus einem System mit anderem Eigentümer. Mit
`--no-owner --no-privileges` einspielen (Variante B) bzw. bei Plain-SQL vorab die
`OWNER TO`-Zeilen entfernen.

**Datenbankstand komplett zurücksetzen**

```bash
docker compose down -v
```

```bash
docker compose up -d
```

Danach die Erstinitialisierung aus [CLAUDE.md](../CLAUDE.md) (`migrate`,
`createcachetable`, `init_season`).
