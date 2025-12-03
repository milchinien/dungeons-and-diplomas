# Dungeon Crawler - Dungeons & Diplomas

Ein rundenbasiertes Dungeon-Crawler-Spiel mit Mathe-Aufgaben, entwickelt mit React + TypeScript.

## Features

- 🗺️ **Prozedural generierte Dungeon-Etagen** mit verschiedenen Raum-Typen
- ⚔️ **Kampfsystem** mit Mathe-Aufgaben zum Besiegen von Gegnern
- 👹 **Boss-Kämpfe** mit erhöhter Schwierigkeit
- 💰 **Schatzräume** zum Sammeln von Gold
- 🛒 **Shop-System** zum Kaufen von Items
- 📊 **Etagen-Progression** mit steigender Schwierigkeit

## Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Styled Components** - Component styling
- **Framer Motion** - Animations

## Installation & Start

```bash
# Dependencies installieren
npm install

# Dev-Server starten
npm run dev

# Build für Production
npm run build
```

Der Dev-Server läuft dann auf: **http://localhost:5173**

## Spielanleitung

### Steuerung
- **D-Taste**: Vorwärts bewegen auf der Karte
- **Klick auf Raum**: Raum betreten
- **Zahleneingabe**: Mathe-Aufgaben im Kampf lösen

### Raum-Typen
- 🚪 **Eingang**: Startpunkt der Etage
- ⚔️ **Kampf**: Gegner mit Mathe-Aufgaben besiegen
- 👹 **Boss**: Stärkerer Gegner mit schwierigeren Aufgaben
- 💰 **Schatz**: Gold und Items sammeln
- 🛒 **Shop**: Items mit Gold kaufen
- 📊 **Ausgang**: Zur nächsten Etage

### Spielablauf
1. Starte am Eingang einer Etage
2. Bewege dich durch die Räume
3. Bekämpfe Gegner mit Mathe-Aufgaben
4. Wähle zwischen zwei Pfaden (Schatz oder Boss)
5. Besuche den Shop
6. Gehe zum Ausgang für die nächste Etage

## Implementierte Phasen (1-6)

✅ **Phase 0**: Projekt-Setup mit Vite, React, TypeScript
✅ **Phase 1**: Design-System & UI-Grundlagen
✅ **Phase 2**: Game State Management (Zustand)
✅ **Phase 3**: Karten-System mit Navigation
✅ **Phase 4**: Combat-System mit Mathe-Aufgaben
✅ **Phase 5**: Raum-Implementierungen (Boss, Treasure, Shop)
✅ **Phase 6**: Etagen-System & Prozeduale Generierung

## Entwicklung

Dieses Projekt ist ein Spike für **Dungeons & Diplomas** und wurde entwickelt von:
- **Michi** (Junior Dev)
- Mit Unterstützung von Claude Code
