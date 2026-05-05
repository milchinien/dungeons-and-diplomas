# Dungeons & Diplomas

Educational browser-based dungeon crawler with procedural dungeon generation, real-time combat, quiz-based enemy encounters, XP, items, highscore tracking, and editor tooling.

## Aktueller Stand

Das Projekt ist eine Next.js-App mit eigenem Canvas-Renderer. Phaser gehoerte zur fruehen Planung/Spike-Phase, ist aber nicht mehr die aktuelle Game-Engine.

Die Datenbank laeuft ueber einen Adapter-Layer:

- **Lokal:** SQLite mit `better-sqlite3`
- **Production/Vercel:** Supabase, sobald `NEXT_PUBLIC_SUPABASE_URL` plus `SUPABASE_SECRET_KEY` oder `SUPABASE_SERVICE_ROLE_KEY` gesetzt sind

Weitere Orientierung:

- [docs/README.md](docs/README.md) - Dokumentationsindex
- [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md) - aktueller Projektstatus
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architekturuebersicht
- [docs/Tasks/01_Plans/Current_Roadmap.md](docs/Tasks/01_Plans/Current_Roadmap.md) - aktuelle Roadmap

## Tech Stack

- **Frontend:** Next.js 14 App Router, React 18, TypeScript
- **Rendering:** HTML Canvas mit eigener Game-/Rendering-Schicht
- **Styling:** Tailwind CSS 4
- **Database:** SQLite lokal, Supabase/PostgreSQL fuer Deployment
- **Package Manager:** npm

## Projekt Setup

### Voraussetzungen

- Node.js 18+
- npm

### Lokales Development

```bash
npm install
npm run dev
```

Die App laeuft standardmaessig unter `http://localhost:3000`.

Ohne Supabase-Env-Variablen nutzt die App automatisch SQLite und legt `data/game.db` beim ersten Start an.

### Checks

```bash
npm run type-check
npm run build
```

`npm run lint` ist im `package.json` vorhanden. Falls Next.js die Lint-Integration in deiner lokalen Version anders behandelt, zuerst Build und Type-Check als harte Checks verwenden.

## Supabase / Vercel

Fuer Supabase-Modus muessen gesetzt sein:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```

Alternativ wird legacy `SUPABASE_SERVICE_ROLE_KEY` akzeptiert.

Auf Vercel ohne Supabase-Konfiguration bricht die App bewusst ab, weil SQLite dort nicht verfuegbar ist.

Migrationen liegen unter `supabase/migrations/`.

## Projektstruktur

```text
dungeons-and-diplomas/
├── app/                    # Next.js App Router und API Routes
├── components/             # React UI und Game Overlays
├── hooks/                  # Auth, Game Loop, Combat, Audio, Shrine, Scoring
├── lib/                    # Game Logic, DB, Rendering, Combat, Dungeon, Items
├── data/                   # Lokale SQLite-Datenbank
├── public/Assets/          # Sprites, Tilesets, Sounds
├── docs/                   # Projekt-Dokumentation
├── supabase/               # Supabase Migrationen und Seeds
└── spikes/                 # Historische Prototypen
```

## Spielfunktionen

- Prozedurale BSP-Dungeons mit Seeds
- Realtime Movement mit WASD/Pfeiltasten
- Canvas-Rendering mit Tiletheme-System
- Fog of War, Minimap, Tueren und Raumzustaende
- Quiz-Combat mit Timer und ELO-basierter Fragenauswahl
- Trashmobs mit Melee-Angriff per Maus
- Shrines mit Buff-Auswahl und Shrine-Gegnern
- XP, Level-Anzeige, Combo-System und Highscores
- Items, Loot-Drops, Inventar und Equipment-Boni
- Level-Editor und Tilemap-/Theme-Editor
- Audio-Einstellungen, Schrittgeraeusche und Musik-Clips

## Steuerung

- **WASD** oder **Pfeiltasten:** Bewegen
- **Linke Maustaste:** Melee-Angriff / Interaktion je nach Kontext
- **I:** Inventar
- **D:** Skill-Dashboard
- **ESC:** Pause/Modals

## Datenbank lokal

Die lokale SQLite-Datenbank wird automatisch erstellt und mit Seed-Fragen befuellt.

```bash
rm data/game.db
npm run dev
```

## Team

- **Tobias Waggoner** ([@tobiaswaggoner](https://github.com/tobiaswaggoner)) - Senior Dev
- **Michi** ([@milchinien](https://github.com/milchinien)) - Junior Dev / Rapid Prototyping
- **Tim** ([@Timiwagg](https://github.com/Timiwagg)) - Junior Dev / Rapid Prototyping

## Workflow

Der `main` Branch ist protected. Immer auf Feature-Branches arbeiten.

```bash
git switch -c feature/my-feature
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

Projektsprache:

- Markdown, Planung und History: Deutsch
- Code, Typen, Kommentare und Commit-Messages: Englisch

## Naechste Schritte

Siehe [aktuelle Roadmap](docs/Tasks/01_Plans/Current_Roadmap.md). Kurzfassung:

1. Frisches lokales Setup und Supabase-Modus verifizieren.
2. Testbasis fuer Kernlogik etablieren.
3. Refactoring-Plan fortsetzen.
4. `Delayed Room Spawn` als naechstes Gameplay-Feature entscheiden.
