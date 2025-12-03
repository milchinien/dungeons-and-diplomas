# Implementationsplan: Spike-Zusammenführung
## Dungeons & Diplomas - Unified Dungeon Crawler

**Datum:** 2025-11-20
**Ziel:** Zusammenführung von `dungeon-clawler-like` und `tw-dungeon-scroller` zu einem kombinierten Spike

---

## 1. Übersicht

### 1.1 Quell-Spikes

**Spike 1: dungeon-clawler-like**
- Technologie: React + Vite + TypeScript
- Stärken: Combat-System, UI-Komponenten, Kampfmechanik
- Path: `spikes/2025-11-19-dungeon-clawler-like/dungeon-crawler/`

**Spike 2: tw-dungeon-scroller**
- Technologie: Next.js + TypeScript
- Stärken: Dungeon-Generierung (BSP), Assets, Fragen-Datenbanken
- Path: `spikes/2025-11-20-tw-dungeon-scroller/`

### 1.2 Ziel-Spike

**Unified Spike: mw-tw-dungeon-and-Diplomas-test**
- Technologie: React + Vite (einfacher für Spike)
- Features: BSP-Dungeon + Combat-System + Bildungs-Fragen
- Path: `spikes/2025-11-20-mw-tw-dungeon-and-Diplomas-test/`

---

## 2. Was wird übernommen

### 2.1 Von tw-dungeon-scroller ✅

#### Dungeon-System
- ✅ `lib/dungeon/BSPNode.ts` - BSP-Algorithmus
- ✅ `lib/dungeon/generation.ts` - Dungeon-Generierung
- ✅ `lib/dungeon/UnionFind.ts` - Room-Connectivity
- ✅ `lib/constants.ts` - Game-Constants
- ✅ `lib/SpriteSheetLoader.ts` - Animation-System
- ✅ `lib/Enemy.ts` - Enemy AI & Behavior

#### Assets
- ✅ `Assets/Castle-Dungeon2_Tiles/` - Kompletter Tileset-Ordner
- ✅ `Assets/player.png` - Player Spritesheet
- ✅ `Assets/player.json` - Player Animation Config
- ✅ `Assets/goblin.png` - Goblin Spritesheet (falls vorhanden)

#### Fragen-Datenbanken
- ✅ `database/chemie.json` - Chemie-Fragen
- ✅ `database/physik.json` - Physik-Fragen
- ✅ `lib/questions.ts` - Fragen-Loader Logic

#### Rendering
- ✅ `components/GameCanvas.tsx` - Canvas-basiertes Rendering
- ✅ Dungeon-Rendering mit Fog of War
- ✅ Minimap-System

### 2.2 Von dungeon-clawler-like ✅

#### Combat-System
- ✅ `components/combat/CombatScene.tsx` - Combat State Management
- ✅ `components/combat/CombatUI.tsx` - HP Bars, Combat UI
- ✅ `components/combat/DungeonView.tsx` - Combat View
- ✅ `components/combat/CharacterSprite.tsx` - Sprite Rendering

#### UI-Komponenten
- ✅ `components/ui/HPBar.tsx` - Health Bar Component
- ✅ `components/ui/HUD.tsx` - Heads-Up Display
- ✅ `components/ui/Inventory.tsx` - Inventar-System
- ✅ `components/ui/GameContainer.tsx` - Game Wrapper
- ✅ `components/ui/PauseMenu.tsx` - Pause Menü

#### Rooms & Items
- ✅ `components/rooms/ShopScene.tsx` - Shop-Raum
- ✅ `components/rooms/TreasureScene.tsx` - Schatz-Raum
- ✅ `data/items.ts` - Item-Definitionen
- ✅ `data/enemies.ts` - Enemy-Definitionen

#### Game Logic
- ✅ `store/gameStore.ts` (falls vorhanden) - Game State Management
- ✅ `utils/lootGenerator.ts` - Loot-System
- ✅ Damage-Calculation Logic

---

## 3. Was wird verworfen

### 3.1 Von dungeon-clawler-like ❌

- ❌ `components/map/MapScene.tsx` - Karten-Ansicht (übersichtliche Node-basierte Map)
- ❌ `components/map/RoomNode.tsx` - Map Node Component
- ❌ `components/combat/MathQuestion.tsx` - Nur Mathe-Fragen (werden durch Multi-Subject ersetzt)
- ❌ `utils/mathGenerator.ts` - Mathe-spezifischer Generator

**Grund:** Das Spiel soll ein scrollendes Dungeon sein, keine Node-basierte Karte

### 3.2 Von tw-dungeon-scroller ❌

- ❌ `database/mathe.json` - Wird durch dungeon-clawler Fragen-System ersetzt
- ❌ Dungeon.html - Single-File Prototype (nicht mehr benötigt)
- ❌ Next.js spezifische Struktur (app/, API routes)

**Grund:** Combat-System vom dungeon-clawler ist ausgereifter

---

## 4. Technische Architektur

### 4.1 Projekt-Struktur

```
spikes/2025-11-20-mw-tw-dungeon-and-Diplomas-test/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── README.md
├── IMPLEMENTATIONSPLAN.md (diese Datei)
├── src/
│   ├── App.tsx                      # Main App Component
│   ├── main.tsx                     # Entry Point
│   ├── components/
│   │   ├── combat/                  # Von dungeon-clawler
│   │   │   ├── CombatScene.tsx
│   │   │   ├── CombatUI.tsx
│   │   │   ├── DungeonView.tsx
│   │   │   ├── CharacterSprite.tsx
│   │   │   └── QuestionUI.tsx       # NEU: Multi-Subject Fragen
│   │   ├── dungeon/                 # Von tw-dungeon-scroller
│   │   │   ├── DungeonCanvas.tsx
│   │   │   └── Minimap.tsx
│   │   ├── rooms/                   # Von dungeon-clawler
│   │   │   ├── ShopScene.tsx
│   │   │   └── TreasureScene.tsx
│   │   └── ui/                      # Von dungeon-clawler
│   │       ├── HPBar.tsx
│   │       ├── HUD.tsx
│   │       ├── Inventory.tsx
│   │       └── GameContainer.tsx
│   ├── lib/
│   │   ├── dungeon/                 # Von tw-dungeon-scroller
│   │   │   ├── BSPNode.ts
│   │   │   ├── generation.ts
│   │   │   └── UnionFind.ts
│   │   ├── constants.ts
│   │   ├── SpriteSheetLoader.ts
│   │   ├── Enemy.ts
│   │   └── questions.ts             # ERWEITERT: Multi-Subject
│   ├── data/
│   │   ├── enemies.ts               # Von dungeon-clawler
│   │   └── items.ts                 # Von dungeon-clawler
│   ├── database/                    # Von tw-dungeon-scroller
│   │   ├── chemie.json
│   │   └── physik.json
│   ├── store/
│   │   └── gameStore.ts             # Game State (Zustand/Redux/Context)
│   ├── utils/
│   │   ├── lootGenerator.ts         # Von dungeon-clawler
│   │   └── questionGenerator.ts     # NEU: Multi-Subject Generator
│   └── types/
│       └── game.ts                  # TypeScript Types
├── public/
│   └── assets/                      # Von tw-dungeon-scroller
│       ├── player.png
│       ├── player.json
│       ├── goblin.png
│       └── Castle-Dungeon2_Tiles/
│           ├── Tileset.png
│           └── Individual_Tiles/
└── docs/
    └── SPIKE_NOTES.md               # Entwicklungs-Notizen
```

### 4.2 Game Flow

```
Start
  ↓
Dungeon Generation (BSP-Algorithmus)
  ↓
Dungeon Exploration (Scrolling Canvas)
  ↓
Enemy Encounter
  ↓
Combat Scene (Bildungs-Fragen)
  ↓
Victory → Loot → Continue Exploring
  oder
Defeat → Zurück zur letzten Position
  ↓
Room Events (Treasure, Shop, etc.)
  ↓
Continue Exploration
```

### 4.3 Kernfunktionalität

#### Dungeon Exploration
- Canvas-basiertes Rendering (von tw-dungeon-scroller)
- BSP-generierte Dungeons
- Fog of War System
- Minimap
- WASD/Arrow Key Movement
- Sprite-basierte Charaktere

#### Combat System
- Turn-based Quiz Combat (von dungeon-clawler)
- Multi-Subject Fragen (Chemie, Physik, evtl. Mathe)
- HP-System mit Damage-Calculation
- Victory/Defeat Screens
- Loot-Rewards

#### Room System
- Empty Rooms (70%)
- Treasure Rooms (20%)
- Combat Rooms (10%)
- Shop Rooms (special)

---

## 5. Implementierungs-Schritte

### Phase 1: Projekt-Setup ✅
1. Initialisiere Vite + React + TypeScript Projekt
2. Setup Package.json Dependencies
3. Konfiguriere TypeScript (tsconfig.json)
4. Erstelle Basis-Ordnerstruktur

### Phase 2: Assets & Core Systems 📦
1. Kopiere Assets-Ordner von tw-dungeon-scroller
2. Kopiere Dungeon-Generation System
   - BSPNode.ts
   - generation.ts
   - UnionFind.ts
   - constants.ts
3. Kopiere SpriteSheetLoader.ts
4. Kopiere Enemy.ts

### Phase 3: Dungeon Rendering 🎨
1. Implementiere DungeonCanvas Component
2. Implementiere Tile-Rendering mit Variants
3. Implementiere Player Movement
4. Implementiere Fog of War
5. Implementiere Minimap

### Phase 4: Combat System ⚔️
1. Kopiere Combat-Komponenten
   - CombatScene.tsx
   - CombatUI.tsx
   - DungeonView.tsx
   - CharacterSprite.tsx
2. Adaptiere für Multi-Subject Fragen
3. Implementiere QuestionUI.tsx (ersetzt MathQuestion)
4. Integriere Fragen-Datenbanken (Chemie, Physik)

### Phase 5: UI & HUD 📊
1. Kopiere UI-Komponenten
   - HPBar.tsx
   - HUD.tsx
   - Inventory.tsx
   - GameContainer.tsx
2. Adaptiere für neue Architektur

### Phase 6: Rooms & Items 🏺
1. Kopiere Room-Komponenten (Shop, Treasure)
2. Kopiere Item & Enemy Daten
3. Implementiere Loot-System

### Phase 7: State Management 🔄
1. Setup Game Store (Zustand/Redux Toolkit)
2. Implementiere Game State
   - Player State
   - Dungeon State
   - Combat State
   - Inventory State
3. Connect Components zu Store

### Phase 8: Integration & Testing 🧪
1. Verbinde Dungeon Exploration mit Combat
2. Teste Enemy Encounters
3. Teste Room Events
4. Teste Victory/Defeat Flow
5. Balance Tuning

### Phase 9: Polish & Documentation 📝
1. Code Cleanup
2. Schreibe README.md
3. Dokumentiere Game Mechanics
4. Create SPIKE_NOTES.md

---

## 6. Technische Herausforderungen

### 6.1 Architektur-Unterschiede

**Problem:** dungeon-clawler nutzt React, tw-dungeon-scroller nutzt Next.js
**Lösung:** Migriere zu reinem React + Vite (einfacher für Spike)

### 6.2 Canvas Integration

**Problem:** tw-dungeon-scroller hat Dungeon in Canvas, dungeon-clawler hat React Components
**Lösung:**
- Dungeon Exploration in Canvas (von tw-dungeon-scroller)
- Combat als React Overlay (von dungeon-clawler)
- Smooth Transition zwischen beiden Modi

### 6.3 Fragen-System

**Problem:** dungeon-clawler hat nur Mathe, tw-dungeon-scroller hat Chemie/Physik/Mathe
**Lösung:**
- Verwende JSON-basierte Datenbanken von tw-dungeon-scroller
- Erweitere QuestionUI für Multi-Subject
- Random Subject Selection im Combat

### 6.4 State Management

**Problem:** Beide Spikes haben unterschiedliche State-Strukturen
**Lösung:**
- Unifiziere auf einen gemeinsamen State Store
- Nutze Zustand oder Redux Toolkit
- Clear separation: DungeonState, CombatState, PlayerState, InventoryState

---

## 7. Game Balance & Design

### 7.1 Combat Balance
- Player HP: 100
- Enemy HP: 30 (normal), 100 (boss)
- Correct Answer: 10 Damage to Enemy
- Wrong Answer: 15 Damage to Player
- Time Limit: 10 Sekunden pro Frage

### 7.2 Dungeon Generation
- Grid Size: 100x100
- Room Size: 4-8 tiles (MIN_ROOM_SIZE, MAX_ROOM_SIZE)
- Room Types: 70% Empty, 20% Treasure, 10% Combat

### 7.3 Movement
- Player Speed: 6 tiles/second
- Enemy Speed: 3 tiles/second
- Aggro Radius: 3 tiles
- Deaggro Radius: 6 tiles

---

## 8. Dependencies

### 8.1 Core
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0"
}
```

### 8.2 State Management
```json
{
  "zustand": "^4.4.0"
}
```

### 8.3 Styling
```json
{
  "styled-components": "^6.1.0"
}
```

### 8.4 Dev Dependencies
```json
{
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@vitejs/plugin-react": "^4.2.0"
}
```

---

## 9. Erfolgs-Kriterien

### Must-Have ✅
- [ ] BSP-basierte Dungeon-Generierung funktioniert
- [ ] Player kann sich mit WASD/Arrows bewegen
- [ ] Fog of War zeigt nur erkundete Räume
- [ ] Combat startet bei Enemy Encounter
- [ ] Fragen aus Chemie/Physik werden angezeigt
- [ ] HP-System funktioniert (Player & Enemy)
- [ ] Victory/Defeat Screens funktionieren
- [ ] Loot-Rewards nach Combat

### Nice-to-Have 🎁
- [ ] Minimap funktioniert
- [ ] Shop-Räume funktional
- [ ] Treasure-Räume funktional
- [ ] Inventory-System
- [ ] Pause-Menü
- [ ] Sound Effects
- [ ] Sprite Animations

### Out of Scope 🚫
- Multiplayer
- Persistence/Savestate
- User Authentication
- Database Backend
- Mobile Support

---

## 10. Zeitplan (Geschätzt)

**Wichtig:** Dies ist ein Spike - kein Production Code!

- Phase 1-2: ~2-3 Stunden (Setup & Assets)
- Phase 3: ~3-4 Stunden (Dungeon Rendering)
- Phase 4: ~4-5 Stunden (Combat System)
- Phase 5-6: ~2-3 Stunden (UI & Rooms)
- Phase 7: ~3-4 Stunden (State Management)
- Phase 8: ~2-3 Stunden (Integration & Testing)
- Phase 9: ~1-2 Stunden (Polish & Docs)

**Total: ~17-24 Stunden** Development Time

---

## 11. Nächste Schritte

1. ✅ Erstelle diesen Implementationsplan
2. ⏳ Erstelle Projekt-Setup (package.json, vite.config.ts, tsconfig.json)
3. ⏳ Kopiere Assets-Ordner
4. ⏳ Implementiere Basis-Struktur
5. ⏳ Beginne mit Phase 3 (Dungeon Rendering)

---

## 12. Notizen

- Dies ist ein **Spike/Prototype** - Code-Qualität ist zweitrangig
- Fokus auf **Proof of Concept** der kombinierten Mechaniken
- Später kann daraus ein sauberes Production-Projekt entstehen
- Dokumentiere alle Learnings in `docs/SPIKE_NOTES.md`

---

**Erstellt von:** Claude Code
**Datum:** 2025-11-20
**Version:** 1.0
