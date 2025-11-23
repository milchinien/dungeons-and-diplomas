# Refactoring-Plan 2025-11-23

## Zusammenfassung

Die Codebasis zeigt eine solide modulare Architektur mit klarer Trennung zwischen API, Datenbank, Rendering und Game-Logik. Es existieren jedoch **11 God-Files** (>300 Zeilen mit gemischten Verantwortlichkeiten), signifikante **Code-Duplikation** bei Tile-Position-Berechnungen (20+ Vorkommen), sowie mehrere **schwer testbare Hooks** mit zu vielen Verantwortlichkeiten.

## Architektur-Snapshot

```
next-app/
├── app/api/          # API-Routes (sauber, kleine Dateien)
├── components/       # React-Komponenten (3 God-Components)
│   ├── combat/       # Combat-UI (DungeonView problematisch)
│   └── editor/       # Editor-UI
├── hooks/            # React-Hooks (3 God-Hooks)
├── lib/
│   ├── api/          # API-Client-Layer (gut strukturiert)
│   ├── combat/       # Combat-Utilities (gut extrahiert)
│   ├── db/           # Datenbank-Layer (gut strukturiert)
│   ├── dungeon/      # Dungeon-Generation (gut strukturiert)
│   ├── enemy/        # Enemy-System (EnemyAI problematisch)
│   ├── game/         # Game-Engine (DungeonManager problematisch)
│   ├── movement/     # Movement-Utilities (gut extrahiert)
│   ├── pathfinding/  # A*-Pathfinding (gut extrahiert)
│   ├── physics/      # Collision-Detection (gut extrahiert)
│   ├── rendering/    # Canvas-Rendering (GameRenderer problematisch)
│   ├── scoring/      # ELO/XP-Berechnung (gut extrahiert)
│   ├── spawning/     # Enemy-Spawning
│   └── tiletheme/    # Theme-System (db.ts problematisch)
└── public/Assets/    # Sprites, Tilesets
```

**Positive Aspekte:**
- ✓ Keine zirkulären Abhängigkeiten
- ✓ API-Client-Layer sauber abstrahiert
- ✓ Utility-Module gut extrahiert (DirectionCalculator, CollisionDetector, etc.)
- ✓ Type-Definitionen zentralisiert

---

## Identifizierte Refactorings

### [R01] ✅ Tile-Position-Utility extrahieren (Quick Win) - ERLEDIGT

**Problem:** Die Berechnung `Math.floor((entity.x + tileSize / 2) / tileSize)` ist **20+ mal** dupliziert in verschiedenen Dateien.

**Lösung:** Neue Utility-Funktion `getTilePosition` und `getEntityTilePosition` in `lib/physics/TileCoordinates.ts`

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/physics/TileCoordinates.ts` erstellt mit `getTilePosition`, `worldToTile`, `tileToWorld`, `getEntityTilePosition`
- ✅ `lib/enemy/EnemyAI.ts` - 4 Stellen ersetzt
- ✅ `lib/game/GameEngine.ts` - 4 Stellen ersetzt
- ✅ `lib/rendering/GameRenderer.ts` - 1 Stelle ersetzt
- ✅ `lib/rendering/MinimapRenderer.ts` - 1 Stelle ersetzt

---

### [R02] ✅ Visibility-Logik aus GameRenderer extrahieren - ERLEDIGT

**Problem:** `GameRenderer.ts` (370 Zeilen) enthielt komplexe Fog-of-War-Logik vermischt mit Rendering-Code. Die Visibility-Berechnung war auch in `DungeonView.tsx` dupliziert.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/visibility/VisibilityCalculator.ts` erstellt mit:
  - `isTileVisible()` - Fog-of-War-Sichtbarkeitsprüfung
  - `getPlayerRoomIds()` - Spieler-Raum-Ermittlung
  - `shouldDimTile()` - Dimming-Berechnung
- ✅ `lib/visibility/index.ts` für Re-exports erstellt
- ✅ `lib/rendering/GameRenderer.ts` - Nutzt nun VisibilityCalculator
  - `isTileVisible` Methode entfernt
  - `getPlayerRoomIds` Methode entfernt
  - `renderTiles()` nutzt `VisibilityCalculator.isTileVisible()`
  - `renderFogOfWar()` nutzt `VisibilityCalculator.shouldDimTile()`
  - `render()` nutzt `VisibilityCalculator.getPlayerRoomIds()`
- ✅ `components/combat/DungeonView.tsx` - Duplizierte Visibility-Logik durch VisibilityCalculator ersetzt

---

### [R03] ✅ Theme-Loading aus DungeonView extrahieren - ERLEDIGT

**Problem:** `DungeonView.tsx` und `DungeonManager.ts` enthielten fast identische Theme-Loading-Logik.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/tiletheme/ThemeLoader.ts` erstellt mit:
  - `loadTheme()` - Lädt Theme via API mit Caching
  - `ensureTilesetsLoaded()` - Lädt alle Tilesets in ThemeRenderer
  - `clearCache()`, `isCached()`, `getCached()` - Cache-Management
- ✅ `lib/game/DungeonManager.ts` - `loadTheme()` nutzt nun ThemeLoader
- ✅ `components/combat/DungeonView.tsx` - Fallback-Theme-Loading nutzt ThemeLoader

---

### [R04] ✅ Combat-Engine aus useCombat extrahieren - ERLEDIGT

**Problem:** `useCombat.ts` vermischte State-Management, Business-Logik und API-Calls.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/combat/CombatEngine.ts` erstellt mit:
  - `processAnswer()` - Pure function für Antwortverarbeitung und Schadensberechnung
  - `calculateDynamicTimeLimit()` - Zeitlimit basierend auf Schwierigkeit
  - `shouldEndCombat()` - Kampfende-Prüfung
  - `getCombatOutcome()` - Ergebnis-Ermittlung (victory/defeat/ongoing)
- ✅ `AnswerResult` Interface für typsichere Rückgaben
- ✅ `hooks/useCombat.ts` nutzt nun CombatEngine:
  - `answerQuestion()` vereinfacht durch `CombatEngine.processAnswer()`
  - `askQuestion()` nutzt `CombatEngine.calculateDynamicTimeLimit()`
  - Kampfende-Prüfung durch `CombatEngine.shouldEndCombat()`

---

### [R05] ✅ Direct Fetch in useGameState durch API-Client ersetzen - ERLEDIGT

**Problem:** `useGameState.ts` (Zeile 103) nutzt direktes `fetch()` statt des API-Clients.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ Import `{ api } from '@/lib/api'` hinzugefügt
- ✅ `fetch('/api/xp', ...)` durch `api.xp.addXp(...)` ersetzt

---

### [R06] ✅ Rendering-Passes in GameRenderer aufteilen - ERLEDIGT

**Problem:** `GameRenderer.render()` (Zeilen 150-369) enthält 4 verschiedene Rendering-Passes in einer Methode.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `isTileVisible()` - Neue private Methode für Fog-of-War-Sichtbarkeit
- ✅ `renderTiles()` - Extrahierte Methode für Tile-Rendering
- ✅ `renderFogOfWar()` - Extrahierte Methode für Dimming-Effekt
- ✅ `renderEnemies()` - Extrahierte Methode für Enemy-Rendering
- ✅ `renderPlayer()` - Extrahierte Methode für Player-Rendering
- ✅ `render()` - Vereinfacht zu 4-Pass-Orchestrierung

**Neue Struktur:**
```typescript
render(...) {
  // Pass 1: Render tiles
  this.renderTiles(...);
  // Pass 2: Render fog of war dimming
  this.renderFogOfWar(...);
  // Pass 3: Render enemies
  this.renderEnemies(...);
  // Pass 4: Render player
  this.renderPlayer(...);
}
```

---

### [R07] ✅ EnemyAI-Hilfsmethoden in separate Module aufteilen - ERLEDIGT

**Problem:** `EnemyAI.ts` (343 Zeilen) war eine statische Klasse mit zu vielen Verantwortlichkeiten: State-Transitions, Pathfinding-Integration, Movement, Waypoint-Management.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `lib/enemy/EnemyMovement.ts` erstellt mit:
  - `moveTowards()` - Movement mit Kollisionserkennung
  - `followPath()` - A* Pfad folgen
  - `moveDirectlyTowardsPlayer()` - Direktes Movement (Fallback)
- ✅ `lib/enemy/EnemyWaypoints.ts` erstellt mit:
  - `pickRandomWaypoint()` - Zufälliges Ziel im Raum wählen
- ✅ `lib/enemy/AggroManager.ts` erstellt mit:
  - `handleStateTransitions()` - IDLE/WANDERING/FOLLOWING Übergänge
- ✅ `lib/enemy/EnemyAI.ts` refaktoriert (~200 Zeilen, von 340 Zeilen)
- ✅ `lib/enemy/index.ts` mit neuen Exports aktualisiert

**Neue Struktur:**
```
lib/enemy/
├── EnemyAI.ts          (202 Zeilen) - Orchestrierung
├── EnemyMovement.ts    (82 Zeilen) - Movement-Logik
├── EnemyWaypoints.ts   (36 Zeilen) - Waypoint-Management
└── AggroManager.ts     (43 Zeilen) - Aggro-State-Transitions
```

---

### [R08] ✅ CharacterPanel in Subkomponenten aufteilen - ERLEDIGT

**Problem:** `CharacterPanel.tsx` (340 Zeilen) war ein monolithischer UI-Block mit ~250 Zeilen inline JSX/Styles.

**Abgeschlossen:** 2025-11-23

**Änderungen:**
- ✅ `components/character/CharacterHeader.tsx` erstellt (40 Zeilen) - Username, Level
- ✅ `components/character/XpProgressBar.tsx` erstellt (56 Zeilen) - XP-Fortschritt
- ✅ `components/character/MasteryCircles.tsx` erstellt (168 Zeilen) - ELO-Kreise mit SubjectRow und EloCircle
- ✅ `components/character/ActionButtons.tsx` erstellt (76 Zeilen) - Logout, Restart, Skills
- ✅ `components/character/index.ts` erstellt für Re-exports
- ✅ `components/CharacterPanel.tsx` refaktoriert (65 Zeilen, von 340 Zeilen)

**Neue Struktur:**
```
components/
├── CharacterPanel.tsx      (65 Zeilen) - Layout & Orchestrierung
└── character/
    ├── index.ts            (11 Zeilen) - Re-exports
    ├── CharacterHeader.tsx (40 Zeilen) - Username, Level
    ├── XpProgressBar.tsx   (56 Zeilen) - XP-Fortschritt
    ├── MasteryCircles.tsx  (168 Zeilen) - ELO-Kreise
    └── ActionButtons.tsx   (76 Zeilen) - Action Buttons
```

---

### [R09] DungeonManager-Verantwortlichkeiten trennen

**Problem:** `DungeonManager.ts` (299 Zeilen) ist für Generation, Theme-Loading, Enemy-Spawning, Treasure-Placement und State-Management verantwortlich.

**Betroffene Dateien:**
- `lib/game/DungeonManager.ts:1-299` - Gesamte Klasse

**Lösung:** Verantwortlichkeiten aufteilen.

```
lib/game/
├── DungeonManager.ts       (100 Zeilen) - State & Koordination
├── DungeonInitializer.ts   (80 Zeilen) - Dungeon-Generierung
├── EntitySpawner.ts        (80 Zeilen) - Enemy/Treasure-Spawning
└── ThemeManager.ts         (80 Zeilen) - Theme-Handling
```

**Aufwand:** L | **Risiko:** hoch

**Schritte:**
1. Interface `IDungeonState` definieren
2. `DungeonInitializer` mit Generierungs-Logik erstellen
3. `EntitySpawner` mit Spawning-Logik erstellen
4. DungeonManager auf neue Module umstellen
5. Umfassende Tests für alle Module

**Abhängigkeiten:** R03 (ThemeLoader) sollte vorher abgeschlossen sein.

**Temporäre Tests:**
- Test: Dungeon-Generierung produziert valide Dungeons
- Test: Entity-Spawning platziert Entities in korrekten Räumen
- Test: Theme-Loading lädt alle erforderlichen Tilesets

---

### [R10] tiletheme/db.ts Funktionen gruppieren

**Problem:** `lib/tiletheme/db.ts` (322 Zeilen) enthält 20+ Funktionen ohne klare Gruppierung: Theme-CRUD, Tileset-CRUD, Tile-Config-Validierung, Import/Export.

**Betroffene Dateien:**
- `lib/tiletheme/db.ts:1-322` - Alle Funktionen

**Lösung:** In logische Module aufteilen.

```
lib/tiletheme/
├── db/
│   ├── themes.ts     (100 Zeilen) - Theme-CRUD
│   ├── tilesets.ts   (60 Zeilen) - Tileset-CRUD
│   └── tiles.ts      (80 Zeilen) - Tile-Config
├── ThemeComposer.ts  (80 Zeilen) - Theme-Assembly
└── db.ts             (20 Zeilen) - Re-exports
```

**Aufwand:** M | **Risiko:** niedrig

**Schritte:**
1. `lib/tiletheme/db/themes.ts` erstellen
2. `lib/tiletheme/db/tilesets.ts` erstellen
3. `lib/tiletheme/db/tiles.ts` erstellen
4. Ursprüngliche db.ts zu Re-export-Datei umbauen
5. Imports in abhängigen Dateien anpassen

---

## Abhängigkeiten zwischen Refactorings

```
R01 (Tile-Position) ─────────────────────────────────────────────── Unabhängig
R02 (Visibility)    ─────────────────────────────────────────────── Unabhängig
R03 (ThemeLoader)   ──┬───────────────────────────────────────────── Unabhängig
                      │
R05 (API-Client)    ─────────────────────────────────────────────── Unabhängig
R06 (Render-Passes) ──┬───────────────────────────────────────────── Abhängig von R02
                      │
R04 (CombatEngine)  ─────────────────────────────────────────────── Unabhängig
R07 (EnemyAI)       ──┬───────────────────────────────────────────── Abhängig von R01
                      │
R08 (CharacterPanel)─────────────────────────────────────────────── Unabhängig
R09 (DungeonManager)──┴───────────────────────────────────────────── Abhängig von R03
R10 (tiletheme/db)  ─────────────────────────────────────────────── Unabhängig
```

## Empfohlene Reihenfolge

### Phase 1: Quick Wins (1-2 Tage) ✅ ABGESCHLOSSEN
1. **R01** - ✅ Tile-Position-Utility - ERLEDIGT 2025-11-23
2. **R05** - ✅ API-Client ersetzen - ERLEDIGT 2025-11-23
3. **R06** - ✅ Render-Passes aufteilen - ERLEDIGT 2025-11-23

### Phase 2: Kernmodule (3-4 Tage)
4. **R02** - ✅ Visibility-Logik - ERLEDIGT 2025-11-23
5. **R03** - ✅ ThemeLoader - ERLEDIGT 2025-11-23
6. **R04** - ✅ CombatEngine - ERLEDIGT 2025-11-23

### Phase 3: Größere Refactorings (5-7 Tage)
7. **R07** - ✅ EnemyAI-Module - ERLEDIGT 2025-11-23
8. **R08** - ✅ CharacterPanel-Subkomponenten - ERLEDIGT 2025-11-23
9. **R10** - tiletheme/db aufteilen (2h)
10. **R09** - DungeonManager-Trennung (6h) ⚠️ Höchstes Risiko

---

## Metriken (vorher → nachher geschätzt)

| Metrik | Aktuell | Nach Phase 1 | Nach Phase 3 |
|--------|---------|--------------|--------------|
| God-Files (>300 Zeilen) | 11 | 10 | 3 |
| Duplizierter Code (Tile-Pos) | 20+ | ✅ 0 | 0 |
| Testbare Pure Functions | ~15 | ✅ ~18 | ~30 |
| Durchschnittl. Datei-Größe | 180 | 160 | 120 |

---

**Erstellt:** 2025-11-23
**Autor:** Claude Code Analyse
**Status:** Phase 3 in Bearbeitung (R07 abgeschlossen)

## Änderungshistorie

| Datum | Phase | Änderungen |
|-------|-------|------------|
| 2025-11-23 | Phase 1 | R01, R05, R06 abgeschlossen |
| 2025-11-23 | Phase 2 | R02, R03, R04 abgeschlossen - Phase 2 komplett! |
| 2025-11-23 | Phase 3 | R07 abgeschlossen - EnemyAI in 3 Module aufgeteilt |
| 2025-11-23 | Phase 3 | R08 abgeschlossen - CharacterPanel in 4 Subkomponenten aufgeteilt |
