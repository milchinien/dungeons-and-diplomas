# Dungeon Game - Next.js Version

Dies ist die Next.js-Version des prozeduralen Dungeon-Crawlers. Das Spiel wurde von der ursprünglichen `dungeon.html` Single-File-Anwendung in eine moderne React/Next.js-Anwendung refactored.

## Setup

1. Dependencies installieren:
```bash
npm install
```

2. Entwicklungsserver starten:
```bash
npm run dev
```

3. Oder Production Build erstellen:
```bash
npm run build
npm start
```

## Projektstruktur

```
next-app/
├── app/
│   ├── layout.tsx          # Root Layout
│   └── page.tsx            # Hauptseite (lädt GameCanvas)
├── components/
│   └── GameCanvas.tsx      # Haupt-Game-Component mit Canvas-Rendering
├── lib/
│   ├── constants.ts        # Alle Spiel-Konstanten und Typen
│   ├── questions.ts        # Fragen-Datenbank
│   ├── SpriteSheetLoader.ts  # Sprite-Animation-System
│   ├── Enemy.ts            # Enemy-Klasse mit AI
│   └── dungeon/
│       ├── BSPNode.ts      # BSP-Algorithmus für Dungeon-Generierung
│       ├── UnionFind.ts    # Union-Find für Room-Connectivity
│       └── generation.ts   # Dungeon-Generierungs-Logik
└── public/
    └── Assets/             # Alle Game-Assets (Sprites, Tilesets)
```

## Änderungen gegenüber dem Original

### Architektur
- **Single File → Modulare Struktur**: Code in separate, wiederverwendbare Module aufgeteilt
- **Vanilla JS → TypeScript**: Vollständige TypeScript-Integration mit Type Safety
- **Globale Variablen → React State & Refs**: State-Management mit React Hooks
- **Inline HTML → JSX Components**: UI als React-Komponenten

### Code-Organisation
- **Constants & Types**: Alle Konstanten in `lib/constants.ts` zentralisiert
- **Dungeon Generation**: BSP-Logik in separates Modul ausgelagert
- **Enemy AI**: Enemy-Klasse als eigenständiges Modul
- **Sprite System**: SpriteSheetLoader als wiederverwendbare Klasse

### Assets
- Assets jetzt im `public/Assets/` Verzeichnis
- Pfade angepasst auf `/Assets/...` für korrektes Next.js-Routing

## Spielfunktionen

Alle Features des Originals bleiben erhalten:

- ✅ Prozedurale Dungeon-Generierung (BSP-Algorithmus)
- ✅ Spieler mit Animation (14 Animationstypen)
- ✅ Enemy AI (Idle, Wandering, Following)
- ✅ Quiz-basiertes Kampfsystem
- ✅ Fog of War
- ✅ Minimap
- ✅ Raumtypen (Empty, Treasure, Combat)
- ✅ HP-System
- ✅ Death Animations

## Steuerung

- **WASD** oder **Pfeiltasten**: Spieler bewegen
- **Button**: Neuen Dungeon generieren

## Technische Details

- **Next.js 14** mit App Router
- **TypeScript** für Type Safety
- **Canvas API** für Rendering (kein Framework wie Phaser)
- **React Hooks** für State Management
- **Embedded Question Database** (keine CORS-Probleme)

## Nächste Schritte

Die Anwendung ist nun bereit für folgende Erweiterungen:

1. **SQLite-Integration** für dynamische Fragen
2. **Progress Tracking** mit Datenbank
3. **User Authentication** (optional)
4. **Mehr Fragen** hinzufügen
5. **Mobile Support** verbessern
6. **Audio/Sound-Effekte** hinzufügen

## Entwicklung

```bash
# Dev-Server mit Hot Reload
npm run dev

# Type-Checking
npm run type-check  # Falls benötigt, im package.json hinzufügen

# Build für Production
npm run build

# Production-Server starten
npm start
```

## Lizenz

Wie im Original-Projekt.
