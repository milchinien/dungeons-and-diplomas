# Dungeons & Diplomas

Educational browser-based dungeon crawler with procedural dungeon generation, real-time combat, and quiz-based enemy encounters.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + React
- **Styling:** Tailwind CSS 4
- **Database:** SQLite (better-sqlite3) - **lokal**
- **Game Engine:** Canvas API (custom rendering)
- **Package Manager:** npm

### Wichtiger Hinweis: Datenbankabstraktion

Die Anwendung nutzt aktuell **SQLite** für lokale Entwicklung. Da SQLite auf Vercel nicht verfügbar ist, muss vor dem Production-Deployment ein **Datenbankabstraktionslayer** implementiert werden, der:
- **Lokal:** SQLite verwendet
- **Production (Vercel):** Supabase (PostgreSQL) verwendet

Dies ist eine zukünftige Aufgabe und nicht Teil der aktuellen Migration.

## Projekt Setup

### Voraussetzungen

- Node.js 18+ installiert
- npm installiert (kommt mit Node.js)

### Lokales Development Setup

1. **Repository klonen** (falls noch nicht geschehen):
   ```bash
   git clone <repository-url>
   cd dungeons-and-diplomas
   ```

2. **Dependencies installieren**:
   ```bash
   npm install
   ```

3. **Development Server starten**:
   ```bash
   npm run dev
   ```

   Browser öffnet automatisch `http://localhost:3000`

4. **TypeScript Type-Checking** (optional):
   ```bash
   npm run type-check
   ```

## Projektstruktur

```
dungeons-and-diplomas/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root Layout
│   ├── page.tsx            # Hauptseite (lädt GameCanvas)
│   ├── globals.css         # Global Styles
│   └── api/                # API Routes
│       ├── questions/      # Fragen-Endpunkte
│       ├── answers/        # Antwort-Logging
│       ├── stats/          # Statistiken
│       └── auth/           # Authentifizierung
├── components/             # React Components
│   ├── GameCanvas.tsx      # Haupt-Game-Component
│   ├── CombatModal.tsx     # Kampf-UI
│   ├── CharacterPanel.tsx  # Spieler-Panel
│   └── ...
├── hooks/                  # React Hooks
│   ├── useAuth.ts          # Authentifizierung
│   ├── useGameState.ts     # Game State Management
│   ├── useCombat.ts        # Kampf-Logik
│   └── ...
├── lib/                     # Utilities & Game Logic
│   ├── constants.ts         # Spiel-Konstanten und Typen
│   ├── db/                  # Datenbank-Operationen
│   ├── dungeon/             # Dungeon-Generierung (BSP)
│   ├── combat/              # Kampf-System
│   ├── scoring/             # ELO-System
│   └── ...
├── data/                    # SQLite Datenbank
│   └── game.db              # Lokale Datenbank
├── public/                  # Static Assets
│   └── Assets/              # Game Assets (Sprites, Tilesets)
├── docs/                    # Projekt-Dokumentation
├── supabase/                # Supabase Migrations (für zukünftige Nutzung)
└── spikes/                  # Experimentelle Prototypen
```

## Available Scripts

```bash
# Development Server starten
npm run dev

# Production Build erstellen
npm run build

# Production Build lokal testen
npm run start

# Linting
npm run lint

# Type-Checking (ohne Build)
npm run type-check
```

## Spielfunktionen

- ✅ Prozedurale Dungeon-Generierung (BSP-Algorithmus)
- ✅ Spieler mit Animation (14 Animationstypen)
- ✅ Enemy AI (Idle, Wandering, Following)
- ✅ Quiz-basiertes Kampfsystem mit ELO-basierter Schwierigkeit
- ✅ Fog of War
- ✅ Minimap
- ✅ Raumtypen (Empty, Treasure, Combat)
- ✅ HP-System
- ✅ Statistiken-Dashboard
- ✅ Session-basierte Fortschrittsverfolgung

## Steuerung

- **WASD** oder **Pfeiltasten**: Spieler bewegen
- **D**: Statistiken-Dashboard öffnen/schließen
- **ESC**: Modals schließen

## Datenbank

Die Anwendung nutzt SQLite für lokale Entwicklung. Die Datenbank wird automatisch beim ersten Start erstellt und mit 30 Seed-Fragen (10 pro Fach: Mathematik, Chemie, Physik) befüllt.

**Datenbank-Location:** `data/game.db`

**Datenbank zurücksetzen:**
```bash
rm data/game.db
# Datenbank wird beim nächsten App-Start neu erstellt
```

## Team

- **Tobias Waggoner** ([@tobiaswaggoner](https://github.com/tobiaswaggoner)) - Senior Dev
- **Michi** ([@milchinien](https://github.com/milchinien)) - Junior Dev / Rapid Prototyping
- **Tim** ([@Timiwagg](https://github.com/Timiwagg)) - Junior Dev / Rapid Prototyping

## Wichtige Hinweise

### Branch Protection

Der `main` Branch ist protected. Immer auf Feature Branches arbeiten:

```bash
# Neuen Feature Branch erstellen
git checkout -b feature/my-new-feature

# Änderungen committen
git add .
git commit -m "feat: implemented something cool"

# Zu GitHub pushen
git push origin feature/my-new-feature

# Dann Pull Request auf GitHub erstellen
```

### Code Style

- **Projektsprache:** Markdown/Docs auf Deutsch, Code/Kommentare auf Englisch
- **TypeScript Strict Mode:** Aktiviert
- **Prettier:** Auto-formatting on save (empfohlen in VSCode)

## Troubleshooting

### `npm run dev` startet nicht

```bash
# Node Modules löschen und neu installieren
rm -rf node_modules
npm install
```

### Datenbank-Fehler

- Stelle sicher, dass `data/` Verzeichnis existiert
- Prüfe, ob `data/game.db` beschreibbar ist
- Bei Problemen: Datenbank löschen und neu erstellen lassen

## Nächste Schritte

1. ✅ Lokale Entwicklung funktioniert
2. ⏳ Datenbankabstraktionslayer implementieren (SQLite lokal, Supabase in Production)
3. ⏳ Vercel Deployment vorbereiten
4. ⏳ Weitere Features entwickeln

## Weitere Dokumentation

- [CLAUDE.md](CLAUDE.md) - Detaillierte technische Dokumentation
- [Agents.md](Agents.md) - Agent-spezifische Anweisungen
- [docs/](docs/) - Projekt-Dokumentation und Pläne
