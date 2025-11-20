# MW TW Dungeons & Diplomas - Test Spike

**Unified Dungeon Crawler Prototype**

Dieser Spike kombiniert zwei verschiedene Dungeon-Crawler Prototypen zu einem vereinheitlichten Spiel:
- BSP-basierte Dungeon-Generierung (von tw-dungeon-scroller)
- Quiz-basiertes Combat-System (von dungeon-clawler-like)

## Features

### Dungeon Exploration
- Prozedural generierte Dungeons (Binary Space Partitioning)
- Canvas-basiertes Rendering mit Sprite-Animationen
- Fog of War System (nur erkundete Räume sichtbar)
- Minimap zur Orientierung
- WASD/Arrow Keys Movement

### Combat System
- Turn-based Quiz Combat
- Multi-Subject Fragen (Chemie, Physik)
- HP-System mit Damage Calculation
- Victory/Defeat Screens
- Loot-Rewards nach Combat

### Room Types
- Empty Rooms (70%)
- Treasure Rooms (20%)
- Combat Rooms (10%)
- Shop Rooms (special)

## Tech Stack

- React 19
- TypeScript
- Vite
- Zustand (State Management)
- Styled Components
- Canvas API (Rendering)

## Project Structure

```
src/
├── components/
│   ├── combat/       # Combat UI & Scene
│   ├── dungeon/      # Dungeon Canvas & Rendering
│   ├── rooms/        # Shop, Treasure, etc.
│   └── ui/           # HUD, HPBar, Inventory
├── lib/
│   ├── dungeon/      # BSP Generation, UnionFind
│   ├── constants.ts
│   ├── Enemy.ts
│   └── questions.ts
├── data/             # Items, Enemies
├── database/         # Chemie, Physik Fragen (JSON)
├── store/            # Zustand Game Store
├── utils/            # Loot Generator, etc.
└── types/            # TypeScript Types
```

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Development

Siehe `IMPLEMENTATIONSPLAN.md` für detaillierte Implementierungs-Schritte und Architektur.

## Controls

- **WASD** or **Arrow Keys**: Move player
- **ESC**: Pause menu
- **I**: Open inventory

## Game Balance

- Player HP: 100
- Enemy HP: 30 (normal), 100 (boss)
- Correct Answer: 10 Damage to Enemy
- Wrong Answer: 15 Damage to Player
- Time Limit: 10 seconds per question

## Notes

Dies ist ein **Spike/Prototype** für Rapid Prototyping.
Code-Qualität ist zweitrangig - Fokus auf Proof of Concept!

---

**Created:** 2025-11-20
**Developers:** Michi (Junior), Tobias (Senior)
