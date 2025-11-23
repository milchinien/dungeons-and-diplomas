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

### [R02] useGameState in fokussierte Sub-Hooks aufteilen
**Problem:** useGameState.ts (304 Zeilen) verwaltet Game Loop, Player Movement, Enemy Updates, Treasure Collection, Window Events und Canvas Initialization in einem Hook.

**Betroffene Dateien:**
- `hooks/useGameState.ts:1-305` - God Hook mit 10+ Verantwortlichkeiten
- `hooks/useGameState.ts:68-78` - Keyboard State Management
- `hooks/useGameState.ts:98-140` - Treasure Collection mit API Call
- `hooks/useGameState.ts:259-278` - Event Handler Registration

**Lösung:** Aufteilung in komponentenbasierte Hooks:
- `useKeyboardInput.ts` - Keyboard State Management (~40 Zeilen)
- `useTreasureCollection.ts` - Treasure XP Logic (~50 Zeilen)

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. `useKeyboardInput.ts` extrahieren (keysRef + Event Handler)
2. `useTreasureCollection.ts` extrahieren (handleTreasureCollected + API Call)
3. useGameState importiert und orchestriert Sub-Hooks
4. Ziel: useGameState < 200 Zeilen

**Temporäre Tests:**
- Test: Keyboard State reagiert korrekt auf KeyDown/KeyUp
- Test: Treasure Collection ruft API korrekt auf

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

### [R05] Date.now() Injection in useCombat
**Problem:** useCombat.ts verwendet `Date.now()` direkt (Zeilen 122, 138) für Answer-Timing. Dies verhindert deterministische Tests.

**Betroffene Dateien:**
- `hooks/useCombat.ts:122` - `questionStartTimeRef.current = Date.now()`
- `hooks/useCombat.ts:138` - `Date.now() - questionStartTimeRef.current`

**Lösung:** Clock Interface mit Injection.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `lib/time/Clock.ts` Interface: `{ now(): number }`
2. `lib/time/SystemClock.ts` Default-Implementation
3. useCombat Props um optionalen `clock` Parameter erweitern
4. Tests können Mock-Clock mit festen Werten injizieren

---

### [R06] useCombat State Machine Reducer Pattern
**Problem:** useCombat.ts (261 Zeilen) kombiniert State Machine Logik mit vielen useRef. State-Tracking über 6 separate Refs erschwert Debugging.

**Betroffene Dateien:**
- `hooks/useCombat.ts:31-46` - Multiple Refs für Combat State
  - `currentEnemyRef`, `askedQuestionsRef`, `currentPlayerEloRef`, `handleTimeoutRef`
- `hooks/useCombat.ts:54-131` - State Transitions verstreut

**Lösung:** Reducer-Pattern für Combat State.

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. `CombatState` Type definieren mit allen State-Feldern
2. `CombatAction` Union Type für Aktionen: START, ASK_QUESTION, ANSWER, END
3. `combatReducer` Function mit allen State-Transitions
4. useCombat auf useReducer + Effects umbauen
5. Business Logic bleibt in CombatEngine

**Temporäre Tests:**
- Test: Reducer State Transitions (IDLE → ACTIVE → FEEDBACK → IDLE)
- Test: Reducer handhabt alle Action Types korrekt

---

### [R07] LevelDistribution.ts aufteilen
**Problem:** LevelDistribution.ts (268 Zeilen) enthält 5+ Helper-Funktionen mit verschiedenen Verantwortlichkeiten: Level-Berechnung, Subject-Weighting, Spawn-Konfiguration.

**Betroffene Dateien:**
- `lib/spawning/LevelDistribution.ts:1-268` - Mixed Concerns

**Lösung:** Aufteilung in fokussierte Module.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `SubjectWeighting.ts` extrahieren - Subject-basierte Gewichtung
2. `SpawnCalculator.ts` extrahieren - Spawn-Konfiguration
3. LevelDistribution als Orchestrator behalten (<100 Zeilen)

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

### [R09] Database Connection Factory für Tests
**Problem:** Datenbank ist Singleton ohne Reset-Möglichkeit. Tests beeinflussen globalen State.

**Betroffene Dateien:**
- `lib/db/connection.ts:8-16` - Module-Level `let db` Singleton

**Lösung:** Factory-Funktion mit optionalem Database Path.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `createDatabase(path?: string)` Factory erstellen
2. In-Memory Option für Tests: `:memory:`
3. `resetDatabase()` Funktion für Test-Setup
4. Bestehender Code bleibt durch Default-Path kompatibel

---

### [R10] ELO-Aggregation aus /api/stats extrahieren
**Problem:** `/api/stats/route.ts` (140 Zeilen) reimplementiert Answer-Grouping-Logik die in `lib/db/questions.ts` bereits existiert.

**Betroffene Dateien:**
- `app/api/stats/route.ts:45-128` - Duplizierte Aggregationslogik
- `lib/db/questions.ts:129-160` - Ähnliche Logik für getQuestionsWithEloBySubject

**Lösung:** Aggregationslogik in DB-Layer konsolidieren.

**Aufwand:** S | **Risiko:** mittel

**Schritte:**
1. `lib/db/stats.ts` erstellen für Stats-spezifische Queries
2. Aggregationslogik aus API-Route verschieben
3. API-Route auf DB-Funktion umstellen
4. Duplikation eliminieren

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

### Nächster Sprint (mittlerer Impact)
5. **R05** - Clock Injection (S, niedrig) - deterministische Tests
6. **R07** - LevelDistribution Split (S, niedrig) - kleinere Module
7. **R09** - DB Factory (S, niedrig) - Test-Setup verbessert
8. **R10** - Stats Extraktion (S, mittel) - Code-Konsolidierung

### Später (höheres Risiko)
9. **R02** - useGameState Split (M, mittel) - komplex aber wichtig
10. **R06** - Combat Reducer (M, mittel) - komplexe State-Logik

## Metriken (Vorher/Nachher Ziel)

| Metrik | Vorher | Nach Quick Wins | Ziel |
|--------|--------|-----------------|------|
| Größte Komponente | 379 Zeilen | 379 Zeilen | <250 Zeilen |
| Größter Hook | 317 Zeilen | 317 Zeilen | <150 Zeilen |
| Größtes Lib-Modul | 351 Zeilen | ~250 Zeilen | <200 Zeilen |
| Dateien >300 Zeilen | 4 | 3 | 0 |
| Unit-testbare Hooks | ~30% | ~40% | >80% |

---

**Erstellt:** 2025-11-23
**Autor:** Claude Code Analyse
**Status:** Quick Wins abgeschlossen (4/10)

## Änderungshistorie

| Datum | Phase | Änderungen |
|-------|-------|------------|
| 2025-11-23 | Quick Wins | R01, R03, R04, R08 abgeschlossen |
