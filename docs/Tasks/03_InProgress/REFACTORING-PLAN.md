# Refactoring-Plan 2025-11-23

## Zusammenfassung

Die Codebase ist gut modularisiert mit klarer Schichtentrennung (Components → Hooks → lib/). Hauptprobleme sind 4 God-Files (>300 Zeilen), 2 God-Hooks (>200 Zeilen), und mehrere Testbarkeits-Probleme durch globale Singletons und direkte fetch()-Aufrufe. Die größten Quick Wins liegen im Aufteilen der DungeonView-Komponente und des useCombat-Hooks.

## Architektur-Snapshot

```
next-app/ (~12.600 Zeilen Code)
├── app/              # 23 Dateien (API Routes + Pages)
├── components/       # 38 Dateien (~3.700 Zeilen)
├── hooks/            # 13 Dateien (~1.550 Zeilen)
└── lib/              # 95 Dateien (~5.800 Zeilen)
    ├── api/          # API Client (11 Dateien)
    ├── combat/       # Combat System (5 Dateien)
    ├── db/           # Database (10 Dateien)
    ├── dungeon/      # Dungeon Generation (5 Dateien)
    ├── enemy/        # Enemy AI (8 Dateien)
    ├── game/         # Game Engine (4 Dateien)
    ├── rendering/    # Rendering (5 Dateien)
    └── tiletheme/    # Tiletheme System (12 Dateien)
```

## Identifizierte Refactorings

### [R01] DungeonView Component aufteilen
**Problem:** 307 Zeilen mit zwei fast identischen useEffect-Blöcken (145 + 80 Zeilen). Code-Duplikation zwischen "Real Dungeon Rendering" und "Fallback Arena Rendering". Tiefe Verschachtelung (4+ Ebenen).

**Betroffene Dateien:**
- `components/combat/DungeonView.tsx:51-195` - Real Dungeon useEffect (145 Zeilen)
- `components/combat/DungeonView.tsx:198-278` - Fallback useEffect (80 Zeilen, Duplikation)

**Lösung:** Extrahiere gemeinsame Rendering-Logik in Custom Hook und teile in Sub-Komponenten auf:
1. `useDungeonRenderer.ts` - Canvas-Setup und Tile-Rendering-Logik
2. `<DungeonCanvas>` - Canvas-Element mit Rendering-Hook
3. `<ArenaCanvas>` - Fallback für statisches Arena-Rendering

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. Extrahiere `drawTileVariant()` Helper in eigene Utility-Datei
2. Erstelle `useDungeonRenderer` Hook mit gemeinsamer Canvas-Logik
3. Splitte DungeonView in zwei Varianten (Real + Fallback)
4. Aktualisiere CombatModal zur Verwendung der neuen Komponenten

---

### [R02] useCombat Hook in Sub-Hooks aufteilen
**Problem:** 273 Zeilen mit 9 Hooks, komplexem Reducer-State und 15+ Dependencies. Vermischt Timer-Management, Question-Auswahl, Damage-Berechnung und API-Calls.

**Betroffene Dateien:**
- `hooks/useCombat.ts:27-273` - Gesamter Hook
- `hooks/useCombat.ts:135-187` - answerQuestion (52 Zeilen, zu komplex)
- `hooks/useCombat.ts:196-238` - startCombat (42 Zeilen, nested async)

**Lösung:** Teile in fokussierte Sub-Hooks auf:
1. `useCombatState` - Reducer und State-Management
2. `useCombatActions` - startCombat, answerQuestion, endCombat
3. `useCombatTimer` - Timer-Logik (bereits useTimer, aber Integration komplex)

**Aufwand:** L | **Risiko:** mittel

**Schritte:**
1. Extrahiere State-Management in `useCombatState.ts`
2. Extrahiere Actions in `useCombatActions.ts` mit State-Dispatch
3. Vereinfache Haupt-Hook zu reiner Orchestration
4. Schreibe Tests für jeden Sub-Hook

---

### [R03] GameEngine.updatePlayer() aufteilen
**Problem:** 94 Zeilen mit 6+ Verantwortlichkeiten (Collision, Door, Treasure, Movement). Tiefe Verschachtelung (4+ Ebenen) und 3+ kombinierte Bedingungen.

**Betroffene Dateien:**
- `lib/game/GameEngine.ts:141-234` - updatePlayer Methode
- `lib/game/GameEngine.ts:58-78` - findAdjacentDoor (wird nur von updatePlayer genutzt)

**Lösung:** Extrahiere Handler-Klassen/-Funktionen:
1. `PlayerMovement.ts` - Bewegungs- und Kollisions-Logik
2. `DoorInteraction.ts` - Tür-Toggle-Logik
3. `TreasureCollector.ts` - Schatz-Sammlung (bereits in useTreasureCollection, aber GameEngine dupliziert)

**Aufwand:** M | **Risiko:** niedrig

**Schritte:**
1. Extrahiere Movement-Logik in separate Funktion
2. Extrahiere Door-Interaction in separate Funktion
3. Vereine Treasure-Collection mit existierendem Hook
4. Refaktoriere updatePlayer zu reiner Orchestration

---

### [R04] Canvas Context Helper extrahieren
**Problem:** Identischer Canvas-Context-Setup-Code an 5+ Stellen. Pattern: `const ctx = canvas.getContext('2d'); if (!ctx) return;`

**Betroffene Dateien:**
- `lib/rendering/GameRenderer.ts:60-62`
- `lib/rendering/MinimapRenderer.ts:19-20`
- `lib/rendering/EditorRenderer.ts:37-38`
- `components/combat/DungeonView.tsx:57-58`
- `components/tilemapeditor/ThemePreview.tsx`

**Lösung:** Erstelle `lib/rendering/canvasUtils.ts`:
```typescript
export function getContext2D(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  return canvas?.getContext('2d') ?? null;
}

export function clearCanvas(ctx: CanvasRenderingContext2D, color: string = '#000000') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Erstelle `lib/rendering/canvasUtils.ts`
2. Implementiere `getContext2D()` und `clearCanvas()`
3. Ersetze duplizierte Code-Stellen
4. Füge `getVisibleTileBounds()` für Tile-Loop-Berechnung hinzu

---

### [R05] DungeonRNG testbar machen
**Problem:** Globale RNG-State-Mutation (`structureRng`, `decorationRng`, `spawnRng`). Tests können nicht parallel laufen, Seed-State wird zwischen Tests geteilt.

**Betroffene Dateien:**
- `lib/dungeon/DungeonRNG.ts:19-21` - Globale let-Variablen
- `lib/dungeon/DungeonRNG.ts:26-29` - `initializeDungeonRNG()` mutiert global

**Lösung:** Erstelle `DungeonRNGPool` Klasse mit Instanz-basiertem State:
```typescript
export class DungeonRNGPool {
  private structureRng: SeededRandom;
  private decorationRng: SeededRandom;
  private spawnRng: SeededRandom;

  constructor(seed: number) {
    this.structureRng = new SeededRandom(seed);
    // ...
  }
}
```

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. Erstelle `DungeonRNGPool` Klasse
2. Migriere alle RNG-Aufrufe zur Pool-Instanz
3. Aktualisiere `generation.ts` und `EntitySpawner.ts`
4. Entferne globale Variablen
5. Schreibe Unit-Tests mit isolierten Seeds

---

### [R06] Fetch()-Aufrufe zentralisieren
**Problem:** 7+ Stellen mit direkten fetch()-Aufrufen ohne API-Client-Verwendung. Keine einheitliche Fehlerbehandlung.

**Betroffene Dateien:**
- `components/editor/SaveLevelModal.tsx:45`
- `components/editor/LevelBrowserModal.tsx:29,47`
- `components/tilemapeditor/TilemapEditorCanvas.tsx:34,44`
- `hooks/tilemapeditor/useTileThemeState.ts:49,74`
- `hooks/tilemapeditor/useTilesetSelection.ts:23`
- `app/editor/page.tsx:13`

**Lösung:** Migriere alle fetch()-Aufrufe zu `lib/api/client.ts`:
1. Erweitere API-Client um fehlende Endpoints
2. Ersetze direkte fetch()-Aufrufe
3. Füge einheitliche Fehlerbehandlung hinzu

**Aufwand:** M | **Risiko:** niedrig

**Schritte:**
1. Erweitere `lib/api/` um Editor- und Tilemap-Endpoints
2. Ersetze fetch() in Komponenten durch API-Client
3. Füge Error-Handling mit Toast-Benachrichtigungen hinzu

---

### [R07] Color Constants zentralisieren
**Problem:** Hardcoded Farbcodes (#000000, #FF00FF, etc.) an 20+ Stellen verstreut.

**Betroffene Dateien:**
- `lib/rendering/TileRenderer.ts:26,101`
- `lib/rendering/MinimapRenderer.ts:22,64,66,68,71,74,76,92`
- `lib/rendering/EditorRenderer.ts:43,88,185,221`
- `lib/tiletheme/ThemeRenderer.ts:116,148`
- `components/combat/DungeonView.tsx:173`

**Lösung:** Erweitere `lib/ui/colors.ts` um Rendering-Konstanten:
```typescript
export const RENDER_COLORS = {
  BACKGROUND: '#000000',
  MISSING_TILE: '#FF00FF', // Magenta
  SELECTION: '#00FFFF',    // Cyan
  // ...
} as const;
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Erweitere `lib/ui/colors.ts`
2. Ersetze hardcoded Farben durch Konstanten
3. Dokumentiere Farbverwendung

---

### [R08] Interfaces für Renderer-Klassen erstellen
**Problem:** TileRenderer, ThemeRenderer, GameRenderer haben keine Interfaces. Nicht mockbar für Tests.

**Betroffene Dateien:**
- `lib/rendering/TileRenderer.ts` - Keine Interface
- `lib/tiletheme/ThemeRenderer.ts` - Keine Interface
- `lib/rendering/GameRenderer.ts` - Keine Interface
- `lib/rendering/MinimapRenderer.ts` - Keine Interface

**Lösung:** Erstelle Interfaces in `lib/rendering/types.ts`:
```typescript
export interface ITileRenderer {
  render(ctx: CanvasRenderingContext2D, ...): void;
}

export interface IThemeRenderer {
  renderTile(ctx: CanvasRenderingContext2D, ...): void;
}
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Erstelle `lib/rendering/types.ts`
2. Definiere Interfaces für alle Renderer
3. Implementiere Interfaces in Klassen
4. Aktualisiere Singleton-Getters zur Rückgabe von Interfaces

---

### [R09] Visibility-Berechnung optimieren
**Problem:** 4-fach verschachtelte Loops in MinimapRenderer für Visibility-Check. O(n) Algorithmus wird bei jedem Render wiederholt.

**Betroffene Dateien:**
- `lib/rendering/MinimapRenderer.ts:41-56` - Nested visibility loops

**Lösung:** Pre-compute Visibility-Map im DungeonManager:
```typescript
// In DungeonManager
updateVisibility(player: Player): void {
  // Berechne einmal pro Player-Move, nicht pro Frame
}
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Erstelle `VisibilityMap` in DungeonManager
2. Aktualisiere Map nur bei Room-Wechsel
3. Verwende pre-computed Map in MinimapRenderer

---

### [R10] LoginModal StorageService verwenden
**Problem:** LoginModal verwendet `localStorage.setItem()` direkt statt der verfügbaren `StorageService` Abstraktions-Schicht.

**Betroffene Dateien:**
- `components/LoginModal.tsx:30-31` - Direkte localStorage-Aufrufe

**Lösung:** Injiziere StorageService als Prop oder verwende Hook mit DI:
```typescript
interface LoginModalProps {
  storage?: StorageService;
  // ...
}
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Importiere StorageService in LoginModal
2. Ersetze localStorage-Aufrufe durch StorageService
3. Ermögliche optionale Injection für Tests

---

## Abhängigkeiten zwischen Refactorings

```
[R04] Canvas Utils → [R01] DungeonView (benötigt Utils)
[R05] DungeonRNG → [R03] GameEngine (RNG wird in Movement genutzt)
[R08] Interfaces → [R01] DungeonView (nutzt Renderer-Interfaces)
```

## Empfohlene Reihenfolge

**Sprint 1 (Quick Wins):** ✅ ABGESCHLOSSEN
1. ✅ [R04] Canvas Context Helper (S, niedrig) - Basis für andere Refactorings
2. ✅ [R07] Color Constants (S, niedrig) - Schneller Cleanup
3. ✅ [R10] LoginModal StorageService (S, niedrig) - Testbarkeit

**Sprint 2 (Medium Impact):**
4. [R08] Renderer Interfaces (S, niedrig) - Vorbereitung für Tests
5. [R09] Visibility optimieren (S, niedrig) - Performance
6. [R06] Fetch zentralisieren (M, niedrig) - Konsistenz

**Sprint 3 (High Impact):**
7. [R03] GameEngine aufteilen (M, niedrig) - Wartbarkeit
8. [R05] DungeonRNG testbar (M, mittel) - Testbarkeit
9. [R01] DungeonView aufteilen (M, mittel) - Größter God-File

**Sprint 4 (Complex):**
10. [R02] useCombat aufteilen (L, mittel) - Komplexester Refactoring

## Temporäre Tests

### Für [R01] DungeonView
```typescript
// Tests vor Refactoring:
describe('DungeonView', () => {
  it('should render tiles correctly', async () => {
    // Mock canvas context
    // Verify drawImage calls
  });

  it('should handle fallback rendering', () => {
    // Test ohne player/dungeon Props
  });
});
```
→ Tests können nach Refactoring für Sub-Komponenten wiederverwendet werden.

### Für [R05] DungeonRNG
```typescript
describe('DungeonRNGPool', () => {
  it('should produce deterministic results with same seed', () => {
    const pool1 = new DungeonRNGPool(12345);
    const pool2 = new DungeonRNGPool(12345);
    expect(pool1.structureRng.next()).toBe(pool2.structureRng.next());
  });

  it('should isolate state between instances', () => {
    const pool1 = new DungeonRNGPool(12345);
    const pool2 = new DungeonRNGPool(67890);
    expect(pool1.structureRng.next()).not.toBe(pool2.structureRng.next());
  });
});
```
→ Tests bleiben permanent als Regression-Tests.

---

**Erstellt:** 2025-11-23
**Status:** Sprint 1 abgeschlossen (2025-11-23)

## Changelog

### Sprint 1 (2025-11-23)
- ✅ [R04] Canvas Context Helper extrahieren
  - `lib/rendering/canvasUtils.ts` erstellt mit `getContext2D()`, `clearCanvas()`, `getVisibleTileBounds()`
  - 11 Dateien aktualisiert
- ✅ [R07] Color Constants zentralisieren
  - `RENDER_COLORS` zu `lib/ui/colors.ts` hinzugefügt
  - Minimap und Editor Farben zentralisiert
- ✅ [R10] LoginModal StorageService verwenden
  - Optional `storage` Prop für Dependency Injection
