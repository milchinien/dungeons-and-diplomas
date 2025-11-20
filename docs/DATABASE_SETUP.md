# Database Setup - Supabase

## Übersicht

Dieses Projekt verwendet Supabase als Backend/Database. Die Datenbank-Migrationen und Seeds befinden sich in:

- **Migrations:** `supabase/migrations/` - SQL-Dateien für Schema-Änderungen
- **Seeds:** `supabase/seed/` - SQL-Dateien für initiale Testdaten

## Setup-Schritte

### 1. Migration ausführen (Tabelle erstellen)

1. Gehe zu deinem Supabase Dashboard: https://supabase.com/dashboard
2. Wähle dein Projekt aus (`dungeons-diplomas`)
3. Gehe zu **SQL Editor** (im linken Menü)
4. Klicke auf **"New query"**
5. Kopiere den Inhalt von `supabase/migrations/20241117000001_create_app_metadata.sql`
6. Füge ihn ein und klicke **"Run"**

**Was passiert:**
- Erstellt die Tabelle `app_metadata` für Versionsinformationen
- Aktiviert Row Level Security (RLS)
- Setzt Policies (jeder kann lesen, nur authenticated users können schreiben)
- Erstellt einen Index für schnellere Abfragen
- Fügt einen Trigger für `updated_at` hinzu

### 2. Seed-Daten einfügen (initiale Daten)

1. Im gleichen **SQL Editor**
2. **"New query"** klicken
3. Kopiere den Inhalt von `supabase/seed/initial_data.sql`
4. Füge ihn ein und klicke **"Run"**

**Was passiert:**
- Fügt initiale Metadaten ein:
  - `app_version`: "0.1.0"
  - `db_schema_version`: "1"
  - `game_mode`: "development"
  - Feature Flags für Combat, Multiplayer, etc.

### 3. Testen

Nach dem Setup kannst du testen:

#### Im Supabase Dashboard:
1. Gehe zu **Table Editor** → `app_metadata`
2. Du solltest 6 Zeilen sehen mit den Seed-Daten

#### In der App:
```bash
pnpm dev
```

In der Browser Console sollte erscheinen:
```
✅ Supabase connection successful - App Version: 0.1.0
```

## Tabellen-Schema

### `app_metadata`

Speichert statische App-Konfiguration und Versionsinformationen.

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | Primärschlüssel (auto-generiert) |
| `key` | TEXT | Eindeutiger Key (z.B. "app_version") |
| `value` | TEXT | Wert (z.B. "0.1.0") |
| `description` | TEXT | Optionale Beschreibung |
| `created_at` | TIMESTAMPTZ | Erstellungszeitpunkt |
| `updated_at` | TIMESTAMPTZ | Letztes Update (auto-update via Trigger) |

**Indizes:**
- `idx_app_metadata_key` auf `key` für schnelle Lookups

**RLS Policies:**
- Public kann lesen (`SELECT`)
- Authenticated Users können alles (`INSERT`, `UPDATE`, `DELETE`)

## Versionsnummer aktualisieren

Um die App-Version zu aktualisieren (z.B. nach einem Release):

```sql
UPDATE app_metadata
SET value = '0.2.0'
WHERE key = 'app_version';
```

Die `updated_at` Spalte wird automatisch aktualisiert durch den Trigger.

## Development vs. Production

**Aktuell:** 1 Supabase Projekt (Development)

**Best Practice für später:**
- **Development:** Eigenes Supabase Projekt + `.env.local`
- **Production:** Separates Supabase Projekt + Vercel Environment Variables

**Vorteile:**
- Keine Gefahr, Production-Daten zu überschreiben
- Verschiedene Feature Flags für Dev/Prod
- Saubere Trennung von Test- und echten Daten

## Troubleshooting

### Migration schlägt fehl: "relation already exists"
Das ist OK! Die Tabelle existiert bereits. Du kannst die Migration überspringen.

### Seed schlägt fehl: "duplicate key value"
Kein Problem! Die Daten existieren bereits. Das `ON CONFLICT` Statement verhindert Duplikate.

### Connection Test zeigt "table not found"
Du hast die Migration noch nicht ausgeführt. Siehe Schritt 1 oben.

## Weitere Migrationen hinzufügen

Neue Migrationen sollten folgendes Format haben:

**Dateiname:** `supabase/migrations/YYYYMMDDHHMMSS_description.sql`

Beispiel:
```
supabase/migrations/20241118120000_add_user_profiles.sql
```

**Wichtig:**
- Timestamp im Dateinamen für korrekte Reihenfolge
- Descriptive Namen verwenden
- Jede Migration sollte idempotent sein (`IF NOT EXISTS`, `ON CONFLICT`, etc.)
