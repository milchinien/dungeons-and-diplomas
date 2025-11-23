# Refactoring-Plan 2025-11-23

## Zusammenfassung

Die Codebasis ist grundsätzlich gut strukturiert mit klarer Trennung zwischen API-Layer, Hooks, und Library-Modulen. Es existieren jedoch mehrere "God Files" in den Hooks (useGameState: 304 Zeilen, useCombat: 261 Zeilen, useTilemapEditorState: 317 Zeilen) und im Rendering-Layer (GameRenderer: 351 Zeilen), die mehrere Verantwortlichkeiten vermischen. Die Testbarkeit ist durch direkte Abhängigkeiten zu Browser-APIs (localStorage, fetch, Canvas) und fehlende Dependency Injection eingeschränkt.

## Architektur-Snapshot

```
next-app/
├── app/                    # Next.js App Router + API Routes (~750 Zeilen)
│   └── api/               # REST Endpoints - gut strukturiert
├── components/            # React Components (~5.400 Zeilen, 35 Dateien)
│   ├── character/        # Character Panel Subkomponenten (306 Zeilen)
│   ├── combat/           # Combat UI (1.359 Zeilen, 9 Dateien)
│   ├── editor/           # Dungeon Editor UI (737 Zeilen)
│   └── tilemapeditor/    # Tilemap Editor (1.374 Zeilen)
├── hooks/                 # Custom Hooks (~1.330 Zeilen, 7 Dateien)
│   ├── useGameState.ts   # GOD HOOK - 304 Zeilen - Game Loop Orchestrierung
│   ├── useCombat.ts      # GOD HOOK - 261 Zeilen - Combat State Machine + API
│   └── useTilemapEditorState.ts # GOD HOOK - 317 Zeilen - Editor State
└── lib/                   # Business Logic (~7.550 Zeilen, 50+ Dateien)
    ├── rendering/        # GameRenderer (351), EditorRenderer (233)
    ├── game/             # GameEngine (264), DungeonManager (136)
    ├── enemy/            # Enemy.ts, EnemyAI.ts (202)
    ├── combat/           # CombatEngine (112) - gut refactored!
    ├── spawning/         # LevelDistribution (268) - GOD FILE
    └── db/               # Database Operations
```

**Datenfluss:** User → GameCanvas → useGameState → GameEngine → DungeonManager → Rendering

**Positive Aspekte:**
- Combat-System gut refaktoriert (CombatEngine, QuestionSelector, AnswerShuffler)
- API-Client-Layer sauber abstrahiert
- Utility-Module gut extrahiert (DirectionCalculator, CollisionDetector, VisibilityCalculator)
- DungeonManager bereits in fokussierte Module aufgeteilt

## Identifizierte Refactorings

### [R01] ✅ GameRenderer Brightness-Logik extrahieren - ERLEDIGT
**Problem:** GameRenderer.ts (351 Zeilen) enthält komplexe `shouldUseBrightTileset()` Logik (Zeilen 53-113) die mit Room-Clearance, Enemy-Checking und Neighbor-Berechnung zu tun hat - nicht mit Rendering.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/rendering/BrightnessCalculator.ts` erstellt mit:
  - `hasEnemiesInRoom()` - Enemy-Checking
  - `getSpatialNeighbors()` - Room-Neighbor-Logik
  - `isRoomClear()` - Room-State-Prüfung
  - `shouldUseBrightTileset()` - Brightness-Berechnung
  - `getAdjacentRoomIds()` - Helper für Nachbar-Räume
- ✅ `lib/rendering/GameRenderer.ts` - Nutzt nun BrightnessCalculator (von 351 auf ~250 Zeilen reduziert)

---

### [R02] ✅ useGameState in fokussierte Sub-Hooks aufteilen - ERLEDIGT
**Problem:** useGameState.ts (304 Zeilen) verwaltet Game Loop, Player Movement, Enemy Updates, Treasure Collection, Window Events und Canvas Initialization in einem Hook.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `hooks/useKeyboardInput.ts` erstellt mit:
  - Keyboard State Management für WASD/Arrow Keys
  - EventTarget-Injection für Testbarkeit (nutzt GameEventTarget)
- ✅ `hooks/useTreasureCollection.ts` erstellt mit:
  - handleTreasureCollected + XP API Call
  - Screen Position Calculation für Popup-Bubbles
- ✅ `hooks/useGameState.ts` refaktoriert:
  - Importiert und orchestriert useKeyboardInput und useTreasureCollection
  - Von 304 auf 243 Zeilen reduziert

---

### [R03] ✅ localStorage Abstraktion für Testbarkeit - ERLEDIGT
**Problem:** useAuth.ts greift direkt auf `localStorage` zu (Zeilen 15-16, 40-41). Tests in Node.js-Umgebung schlagen fehl.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/storage/StorageService.ts` erstellt mit:
  - `StorageService` Interface: `get()`, `set()`, `remove()`
  - `LocalStorageService` - Default-Implementation für Browser
  - `InMemoryStorageService` - In-Memory für Tests mit `clear()` und `keys()`
  - `defaultStorage` - Export der Default-Instance
- ✅ `lib/storage/index.ts` erstellt für Re-exports
- ✅ `hooks/useAuth.ts` refaktoriert:
  - Neues `UseAuthOptions` Interface mit optionalem `storage` Parameter
  - Nutzt `storage.get()`, `storage.remove()` statt direktem localStorage

---

### [R04] ✅ constants.ts aufteilen - ERLEDIGT
**Problem:** constants.ts (234 Zeilen) vermischt numerische Konstanten, Type-Definitionen, Enums, und Sprite-Konfiguration.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/enums.ts` erstellt mit:
  - `TILE`, `DIRECTION`, `DIRECTION_OFFSETS`, `ANIMATION`, `AI_STATE`, `DUNGEON_ALGORITHM`
  - Abgeleitete Types: `Direction`, `AnimationType`, `TileType`, `AIStateType`, `DungeonAlgorithm`
- ✅ `lib/spriteConfig.ts` erstellt mit:
  - `ANIM_SPEEDS` - Animation-Geschwindigkeiten
  - `SPRITESHEET_CONFIGS` - Player/Goblin Sprite-Definitionen
  - `TILE_SOURCE_SIZE`, `TILESET_COORDS`, `WALL_VARIANTS`, `FLOOR_VARIANTS`
  - `AnimationDefinition`, `SpritesheetConfig` Interfaces
- ✅ `lib/constants.ts` refaktoriert:
  - Re-exports aller Enums und Sprite-Configs für Abwärtskompatibilität
  - Nur noch Game-Constants (DUNGEON_WIDTH, PLAYER_SPEED, etc.) und Type-Definitionen
  - Von 234 auf ~115 Zeilen reduziert

---

### [R05] ✅ Date.now() Injection in useCombat - ERLEDIGT
**Problem:** useCombat.ts verwendet `Date.now()` direkt (Zeilen 122, 138) für Answer-Timing. Dies verhindert deterministische Tests.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/time/Clock.ts` erstellt mit:
  - `Clock` Interface: `{ now(): number }`
  - `SystemClock` - Production-Implementation
  - `MockClock` - Test-Implementation mit `setTime()` und `advance()`
  - `defaultClock` - Export der Default-Instance
- ✅ `lib/time/index.ts` erstellt für Re-exports
- ✅ `hooks/useCombat.ts` refaktoriert:
  - Neuer optionaler `clock` Parameter in UseCombatProps
  - `Date.now()` durch `clock.now()` ersetzt

---

### [R06] ✅ useCombat State Machine Reducer Pattern - ERLEDIGT
**Problem:** useCombat.ts (261 Zeilen) kombiniert State Machine Logik mit vielen useRef. State-Tracking über 6 separate Refs erschwert Debugging.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/combat/combatReducer.ts` erstellt mit:
  - `CombatPhase` Type: 'idle' | 'loading' | 'active' | 'feedback' | 'victory' | 'defeat'
  - `CombatState` Interface für konsolidierten State
  - `CombatAction` Union Type für alle Aktionen
  - `combatReducer()` Function mit klaren State-Transitions
  - Helper: `isInCombat()`, `isWaitingForAnswer()`
- ✅ `hooks/useCombat.ts` refaktoriert:
  - useState/useRef durch useReducer ersetzt
  - Konsolidierter State statt 6 separater Refs
  - Klare State-Transitions über dispatch()
  - Abwärtskompatibles Return-Interface beibehalten

---

### [R07] ✅ LevelDistribution.ts aufteilen - ERLEDIGT
**Problem:** LevelDistribution.ts (268 Zeilen) enthält 5+ Helper-Funktionen mit verschiedenen Verantwortlichkeiten: Level-Berechnung, Subject-Weighting, Spawn-Konfiguration.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/spawning/SubjectWeighting.ts` erstellt mit:
  - `calculateSubjectWeights()` - Berechnet inverse ELO-basierte Gewichtung
  - `selectWeightedSubject()` - Wählt Subject nach Gewichtung
- ✅ `lib/spawning/SpawnCalculator.ts` erstellt mit:
  - `EnemySpawnConfig` Interface
  - `SpawnCalculationInput` Interface
  - `calculateEnemySpawns()` - Haupt-Spawn-Logik
  - `collectRoomFloorTiles()` - Helper für Floor-Tile-Sammlung
  - `getRoomSpawnStrategy()` - Room-Type-basierte Strategie
- ✅ `lib/spawning/LevelDistribution.ts` refaktoriert:
  - Re-exports für Abwärtskompatibilität
  - Nur noch Level-Generierung: `randomNormal`, `generateNormalRoomLevel`, `generateCombatRoomLevel`
  - Von 268 auf 93 Zeilen reduziert

---

### [R08] ✅ API Parameter Validation Utility - ERLEDIGT
**Problem:** Mehrere API-Routes wiederholen identische Parameter-Validation-Patterns für URL Query Params.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/api/validation.ts` erstellt mit:
  - `ValidationResult<T>` - Type für Success/Error-Handling
  - `getSearchParams(request)` - Extrahiert searchParams aus Request
  - `getRequiredStringParam(searchParams, paramName)` - Pflicht-String-Parameter
  - `getRequiredIntParam(searchParams, paramName)` - Pflicht-Int-Parameter
  - `getOptionalStringParam(searchParams, paramName)` - Optionaler String
  - `getOptionalIntParam(searchParams, paramName)` - Optionaler Int
  - `parseRouteIntParam(value, paramName)` - Für Route-Parameter wie [id]
- ✅ `lib/api/index.ts` - Re-exportiert validation utilities
- ✅ `app/api/questions-with-elo/route.ts` - Refaktoriert mit validation utilities
- ✅ `app/api/session-elo/route.ts` - Refaktoriert mit validation utilities

---

### [R09] ✅ Database Connection Factory für Tests - ERLEDIGT
**Problem:** Datenbank ist Singleton ohne Reset-Möglichkeit. Tests beeinflussen globalen State.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/db/connection.ts` erweitert mit:
  - `DatabaseOptions` Interface: `{ path?: string, seed?: boolean }`
  - `createDatabase(options)` - Factory für Custom-Databases
  - `createTestDatabase(seed?)` - Convenience für In-Memory Tests
  - `resetDatabase()` - Schließt und leert Singleton
- ✅ `lib/db/init.ts` erweitert mit:
  - `InitOptions` Interface: `{ seed?: boolean }`
  - `initializeDatabase()` akzeptiert nun Seed-Option
- ✅ `lib/db/index.ts` - Exportiert neue Funktionen und Types

---

### [R10] ✅ ELO-Aggregation aus /api/stats extrahieren - ERLEDIGT
**Problem:** `/api/stats/route.ts` (140 Zeilen) reimplementiert Answer-Grouping-Logik die in `lib/db/questions.ts` bereits existiert.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/db/stats.ts` erstellt mit:
  - `QuestionStats` Interface - Stats für einzelne Fragen
  - `SubjectStats` Interface - Stats für Fächer
  - `UserStats` Interface - Vollständige User-Statistiken
  - `getUserStats(userId)` - Aggregiert alle User-Statistiken
- ✅ `app/api/stats/route.ts` vereinfacht:
  - Von 140 auf 21 Zeilen reduziert
  - Nutzt nun `getUserStats()` aus DB-Layer
- ✅ `lib/db/index.ts` - Exportiert neue Funktionen und Types

---

## Abhängigkeiten zwischen Refactorings

```
R03 (localStorage) ──────┐
R05 (Clock)        ──────┼──> Unabhängig, verbessern Testbarkeit
R09 (DB Factory)   ──────┘

R01 (BrightnessCalc) ────> Unabhängig

R04 (constants Split) ───> Unabhängig

R02 (useGameState) ──────> Profitiert von R03, R05

R06 (Combat Reducer) ────> Profitiert von R05

R07 (LevelDistribution) ─> Unabhängig

R08 (API Validation) ────> Unabhängig

R10 (Stats Extract) ─────> Unabhängig
```

## Priorisierung

### Quick Wins (hoher Impact, niedriges Risiko) ✅ ABGESCHLOSSEN
1. **R01** - ✅ BrightnessCalculator extrahieren - ERLEDIGT 2025-11-23
2. **R03** - ✅ localStorage Abstraktion - ERLEDIGT 2025-11-23
3. **R04** - ✅ constants.ts aufteilen - ERLEDIGT 2025-11-23
4. **R08** - ✅ API Validation Utility - ERLEDIGT 2025-11-23

### Nächster Sprint (mittlerer Impact) ✅ ABGESCHLOSSEN
5. **R05** - ✅ Clock Injection - ERLEDIGT 2025-11-23
6. **R07** - ✅ LevelDistribution Split - ERLEDIGT 2025-11-23
7. **R09** - ✅ DB Factory - ERLEDIGT 2025-11-23
8. **R10** - ✅ Stats Extraktion - ERLEDIGT 2025-11-23

### Sprint 3 (höheres Risiko) ✅ ABGESCHLOSSEN
9. **R02** - ✅ useGameState Split - ERLEDIGT 2025-11-23
10. **R06** - ✅ Combat Reducer - ERLEDIGT 2025-11-23

## Metriken (Vorher/Nachher Ziel)

| Metrik | Vorher | Nach Quick Wins | Nach Sprint 2 | Nach Sprint 3 | Ziel |
|--------|--------|-----------------|---------------|---------------|------|
| Größte Komponente | 379 Zeilen | 379 Zeilen | 379 Zeilen | 379 Zeilen | <250 Zeilen |
| Größter Hook | 317 Zeilen | 317 Zeilen | 317 Zeilen | ~280 Zeilen | <150 Zeilen |
| Größtes Lib-Modul | 351 Zeilen | ~250 Zeilen | ~250 Zeilen | ~250 Zeilen | <200 Zeilen |
| Dateien >300 Zeilen | 4 | 3 | 3 | 2 | 0 |
| Unit-testbare Hooks | ~30% | ~40% | ~60% | ~75% | >80% |

---

**Erstellt:** 2025-11-23
**Autor:** Claude Code Analyse
**Status:** ✅ ABGESCHLOSSEN (10/10)

## Änderungshistorie

| Datum | Phase | Änderungen |
|-------|-------|------------|
| 2025-11-23 | Quick Wins | R01, R03, R04, R08 abgeschlossen |
| 2025-11-23 | Sprint 2 | R05, R07, R09, R10 abgeschlossen |
| 2025-11-23 | Sprint 3 | R02, R06 abgeschlossen - Plan vollständig!
