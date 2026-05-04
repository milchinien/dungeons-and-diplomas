# Database Setup

**Stand:** 2026-05-04

## Ueberblick

Die App nutzt einen Datenbank-Adapter-Layer.

- Ohne Supabase-Env-Variablen: SQLite lokal (`data/game.db`)
- Mit Supabase-Env-Variablen: Supabase/PostgreSQL
- Auf Vercel: Supabase ist Pflicht, weil `better-sqlite3` dort nicht verfuegbar ist

Der Adapter wird in `lib/db/adapters/factory.ts` ausgewaehlt.

## Lokales SQLite

```bash
npm install
npm run dev
```

Wenn keine Supabase-Variablen gesetzt sind, wird SQLite automatisch verwendet. Die Datenbank wird beim ersten Zugriff angelegt und mit Seed-Fragen aus `lib/data/seed-questions.json` befuellt.

### Reset

```bash
rm data/game.db
npm run dev
```

## Supabase-Konfiguration

### Benoetigte Variablen

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```

Legacy wird weiterhin akzeptiert:

```bash
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SECRET_KEY` oder `SUPABASE_SERVICE_ROLE_KEY` wird serverseitig fuer Backend-Operationen verwendet. Nicht in Client-Code einbauen.

### Migrationen

Die Migrationen liegen unter `supabase/migrations/`.

Aktueller Satz:

1. `20241117000001_create_app_metadata.sql`
2. `20241225000001_create_users.sql`
3. `20241225000002_create_questions.sql`
4. `20241225000003_create_answer_log.sql`
5. `20241225000004_create_xp_log.sql`
6. `20241225000005_create_highscores.sql`
7. `20241225000006_create_editor_levels.sql`
8. `20241225000007_create_tiletheme_tables.sql`
9. `20241225000008_seed_questions.sql`

### Manuelles Setup im Supabase Dashboard

1. Supabase Dashboard oeffnen.
2. Projekt auswaehlen.
3. SQL Editor oeffnen.
4. Migrationen in Reihenfolge aus `supabase/migrations/` ausfuehren.
5. Env-Variablen lokal oder in Vercel setzen.
6. App starten und zentrale API-Routen testen.

## Tabellen

| Tabelle | Zweck |
| --- | --- |
| `users` | Username, XP, Login-Zeitpunkte |
| `questions` | Fragenpool mit Antworten und Fach |
| `answer_log` | Antwort-Historie fuer ELO/Stats |
| `xp_log` | XP-Gewinne |
| `highscores` | Run-Ergebnisse |
| `editor_levels` | Gespeicherte Editor-Level |
| Tiletheme-Tabellen | Tilesets, Tile-Themes und Dungeon-Themes |
| `app_metadata` | Historische App-Metadaten aus frueher Setup-Phase |

## Adapter-Verhalten

```text
NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY vorhanden
  -> SupabaseAdapter

NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY vorhanden
  -> SupabaseAdapter

Keine Supabase-Konfiguration und nicht Vercel
  -> SQLiteAdapter

Vercel ohne Supabase-Konfiguration
  -> Fehler
```

## Verifikations-Checkliste

- `POST /api/auth/login` erstellt oder laedt User.
- `GET /api/questions` liefert Seed-Fragen.
- `POST /api/answers` schreibt Antwort-Logs.
- `GET /api/session-elo` berechnet ELO-Ausgangswerte.
- `POST /api/xp` erhoeht User-XP und schreibt `xp_log`.
- `GET/POST /api/highscores` funktioniert.
- `GET/POST /api/editor/levels` funktioniert.
- `GET /api/theme/1` liefert Theme-Daten oder sinnvolle Fehler.
- Tilemap-Editor-Routen lesen/schreiben Tilesets und Themes.

## Bekannte Risiken

- Supabase-Mode sollte nach laengerer Pause auf einem frischen Projekt erneut Ende-zu-Ende getestet werden.
- Clientseitige Game-Events werden aktuell serverseitig nicht gegenvalidiert.
- Row Level Security und Policies muessen vor Public Launch bewusst geprueft werden.
