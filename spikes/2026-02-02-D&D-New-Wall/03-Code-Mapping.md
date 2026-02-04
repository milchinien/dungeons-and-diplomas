# Code-Mapping: Alle betroffenen Dateien

**Datum:** 2026-02-04
**Datei:** 03-Code-Mapping.md

---

## Übersicht

Diese Datei listet **ALLE** Code-Stellen auf, die von der Tileset-Änderung betroffen sind.

**Format:**
```
Datei: <pfad>
Zeilen: <start>-<end>
Beschreibung: <was hier passiert>
Änderung nötig: <ja/nein>
Priorität: <KRITISCH / HOCH / MITTEL / NIEDRIG>
```

---

## 1. KRITISCH: Tile-Koordinaten

### lib/spriteConfig.ts

#### Zeilen 86-135: TILESET_COORDS
```typescript
export const TILESET_COORDS = {
  FLOOR: { x: 0, y: 1 },
  WALL_TOP: { x: 0, y: 0 },
  // ... alle Wand-Typen ...
}
```

**Beschreibung:** Definiert die Koordinaten jedes Tiles im Tileset

**Änderung nötig:** ✅ **JA - KRITISCH**
- Alle `WALL_*` Koordinaten müssen aktualisiert werden
- Alle `DOOR_*` Koordinaten müssen aktualisiert werden
- `FLOOR` bleibt unverändert (außer du willst auch die Böden ändern)

**Betroffene Felder:**
```typescript
WALL_TOP: { x: ??, y: ?? },           // HORIZONTAL
WALL_BOTTOM: { x: ??, y: ?? },        // HORIZONTAL
WALL_LEFT: { x: ??, y: ?? },          // VERTICAL
WALL_RIGHT: { x: ??, y: ?? },         // VERTICAL
WALL_HORIZONTAL: { x: ??, y: ?? },
WALL_VERTICAL: { x: ??, y: ?? },
CORNER_TL: { x: ??, y: ?? },
CORNER_TR: { x: ??, y: ?? },
CORNER_BL: { x: ??, y: ?? },
CORNER_BR: { x: ??, y: ?? },
T_UP: { x: ??, y: ?? },
T_DOWN: { x: ??, y: ?? },
T_LEFT: { x: ??, y: ?? },
T_RIGHT: { x: ??, y: ?? },
CROSS: { x: ??, y: ?? },
DOOR_HORIZONTAL_CLOSED: { x: ??, y: ?? },
DOOR_HORIZONTAL_OPEN: { x: ??, y: ?? },
DOOR_VERTICAL_CLOSED: { x: ??, y: ?? },
DOOR_VERTICAL_OPEN: { x: ??, y: ?? },
```

**Priorität:** 🔴 **KRITISCH**

---

## 2. HOCH: Rendering

### lib/rendering/TileRenderer.ts

#### Zeilen 1-50: Tileset-Laden
```typescript
private tileset: HTMLImageElement | null = null;
private tilesetLoaded = false;

constructor() {
  this.tileset = new Image();
  this.tileset.src = '/Assets/Castle-Dungeon2_Tiles/Tileset.png';
}
```

**Beschreibung:** Lädt das Tileset-Bild

**Änderung nötig:** ❌ **NEIN**
- Pfad bleibt gleich (`Tileset.png`)
- Nur das Bild wird ausgetauscht

**Priorität:** 🟢 **NIEDRIG** (Monitoring)

---

#### Zeilen 100-300: renderTile() Methode
```typescript
private renderTile(
  ctx: CanvasRenderingContext2D,
  tileType: TileType,
  wallType: WallType | null,
  doorType: DoorType | null,
  // ...
) {
  // Wählt Koordinaten aus TILESET_COORDS
  // Zeichnet Tile auf Canvas
}
```

**Beschreibung:** Zeichnet ein einzelnes Tile basierend auf Koordinaten

**Änderung nötig:** ❌ **NEIN**
- Logik bleibt gleich
- Nutzt automatisch neue Koordinaten aus `spriteConfig.ts`

**Priorität:** 🟡 **MITTEL** (Testing)

---

### lib/rendering/GameRenderer.ts

#### Zeilen 200-400: Dungeon-Rendering
```typescript
render(
  ctx: CanvasRenderingContext2D,
  dungeon: TileType[][],
  renderMap: RenderMap,
  // ...
) {
  // Nutzt TileRenderer
}
```

**Beschreibung:** Haupt-Rendering-Schleife

**Änderung nötig:** ❌ **NEIN**
- Nutzt TileRenderer automatisch
- Keine direkten Koordinaten-Zugriffe

**Priorität:** 🟢 **NIEDRIG** (Monitoring)

---

## 3. HOCH: Wand-Erkennung (Bug-Fix!)

### lib/tiletheme/WallTypeDetector.ts

#### Zeilen 1-141: GESAMTE DATEI
```typescript
export function detectWallType(
  dungeon: TileType[][],
  x: number,
  y: number
): WallType {
  // Erkennt Wand-Typ basierend auf Nachbarn
}
```

**Beschreibung:** Autotiling-Logik für Wände

**Änderung nötig:** ⚠️ **JA - BUG-FIX**
- Zeilen 53-56: HORIZONTAL/VERTICAL swap (bereits dokumentiert)
- Zeilen 60-65: END_* swap (bereits dokumentiert)
- Zeilen 75-81: Fallback-Mapping (prüfen!)

**Bekannte Bugs:**
1. **Zeilen 53-56:** HORIZONTAL und VERTICAL waren vertauscht
   ```typescript
   // BUG FIX: Swapped HORIZONTAL and VERTICAL to match tileset orientation
   if (hasLeft && hasRight) return WALL_TYPE.VERTICAL;    // Wall runs left-right → needs vertical tile
   if (hasTop && hasBottom) return WALL_TYPE.HORIZONTAL;  // Wall runs top-bottom → needs horizontal tile
   ```

2. **Zeilen 60-65:** END_* Typen waren vertauscht
   ```typescript
   // BUG FIX: Swapped to match vertical/horizontal swap above
   if (hasRight) return WALL_TYPE.END_TOP;     // Swapped from END_LEFT
   if (hasLeft) return WALL_TYPE.END_BOTTOM;   // Swapped from END_RIGHT
   if (hasBottom) return WALL_TYPE.END_LEFT;   // Swapped from END_TOP
   if (hasTop) return WALL_TYPE.END_RIGHT;     // Swapped from END_BOTTOM
   ```

**Priorität:** 🔴 **KRITISCH** (Siehe Dokument 06)

---

#### Zeilen 91-121: detectDoorType()
```typescript
export function detectDoorType(
  dungeon: TileType[][],
  x: number,
  y: number,
  isOpen: boolean = false
): DoorType {
  // Erkennt Tür-Orientierung
}
```

**Beschreibung:** Erkennt ob Tür horizontal oder vertikal ist

**Änderung nötig:** ❌ **NEIN** (bereits gefixt)
- Zeilen 100-110: Logik korrekt
- Nutzt Koordinaten aus `spriteConfig.ts`

**Priorität:** 🟡 **MITTEL** (Testing)

---

### lib/tiletheme/types.ts

#### Zeilen 33-59: WALL_TYPE Definitionen
```typescript
export const WALL_TYPE = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  // ... alle Typen ...
} as const;
```

**Beschreibung:** Type-Definitionen für Wände

**Änderung nötig:** ❌ **NEIN**
- Nur Definitionen, keine Werte

**Priorität:** 🟢 **NIEDRIG**

---

## 4. MITTEL: Dungeon-Generierung

### lib/dungeon/generation.ts

#### Zeilen 1-300: BSP-Generierung
```typescript
export function generateRooms(dungeon, roomMap, config) {
  // Erstellt Räume
  // Fügt Wände hinzu
}

export function connectRooms(dungeon, roomMap, rooms, config) {
  // Verbindet Räume mit Türen
}
```

**Beschreibung:** Dungeon-Generierung mit BSP

**Änderung nötig:** ❌ **NEIN**
- Nutzt nur `TILE.WALL` und `TILE.DOOR`
- Keine direkten Koordinaten

**Priorität:** 🟡 **MITTEL** (Testing - Doppel-Wände!)

---

#### Zeilen 8-28: getWeightedRandomVariant()
```typescript
export function getWeightedRandomVariant(variants) {
  // Wählt zufällige Wall-Variante basierend auf Gewichten
}
```

**Beschreibung:** Wählt zufällige Wand-Variante

**Änderung nötig:** ❌ **NEIN**
- Logik unabhängig von Koordinaten
- Nutzt `WALL_VARIANTS` aus `constants.ts`

**Priorität:** 🟢 **NIEDRIG**

---

### lib/dungeon/layoutGeneration.ts

#### Zeilen 1-300: Layout-basierte Generierung
```typescript
export function generateDungeonFromLayouts(targetRoomCount, seed) {
  // Generiert Dungeon aus vordefinierten Layouts
}
```

**Beschreibung:** Alternative Generierungs-Methode

**Änderung nötig:** ❌ **NEIN**
- Nutzt gleiche Tile-Typen
- Keine direkten Koordinaten

**Priorität:** 🟡 **MITTEL** (Testing)

---

## 5. MITTEL: Room Editor

### components/roomeditor/LayoutCanvas.tsx

#### Zeilen 1-500: Canvas-Rendering
```typescript
const drawGrid = () => {
  // Zeichnet Grid mit Tiles
  // Nutzt Tileset für Preview
}
```

**Beschreibung:** Room Editor Canvas

**Änderung nötig:** ❌ **NEIN**
- Nutzt automatisch neues Tileset
- ABER: Visuell testen!

**Priorität:** 🟡 **MITTEL** (Visual Testing)

---

### components/tilemapeditor/ThemePreview.tsx

#### Zeilen 1-300: Theme-Preview
```typescript
export function ThemePreview({ theme }) {
  // Zeigt Preview des Tile-Themes
}
```

**Beschreibung:** Preview für Tilemap-Editor

**Änderung nötig:** ❌ **NEIN**
- Nutzt Theme-System automatisch

**Priorität:** 🟡 **MITTEL** (Visual Testing)

---

## 6. NIEDRIG: Tests

### tests/e2e/dungeon-walls-visual-check.spec.ts

**Beschreibung:** Visueller Test für Wände

**Änderung nötig:** ⚠️ **EVENTUELL**
- Screenshots könnten sich ändern
- Visuelle Regression-Tests updaten

**Priorität:** 🟡 **MITTEL** (Nach Implementierung)

---

### tests/e2e/dungeon-double-walls.spec.ts

**Beschreibung:** Test für Doppel-Wände Bug

**Änderung nötig:** ❌ **NEIN**
- Testet Logik, nicht Koordinaten

**Priorität:** 🔴 **KRITISCH** (Test sollte nach Bug-Fix passen)

---

### tests/dungeon-double-walls.test.ts

**Beschreibung:** Unit-Test für Doppel-Wände

**Änderung nötig:** ❌ **NEIN**
- Testet nur Logik

**Priorität:** 🟡 **MITTEL**

---

## Zusammenfassung: Änderungsliste

### 🔴 KRITISCH (MUSS geändert werden)
1. **lib/spriteConfig.ts** (Zeilen 86-135)
   - Alle Wand-Koordinaten
   - Alle Tür-Koordinaten

2. **lib/tiletheme/WallTypeDetector.ts** (Zeilen 53-81)
   - Bug-Fix für HORIZONTAL/VERTICAL swap
   - Bug-Fix für END_* swap
   - Fallback-Mapping validieren

### 🟡 MITTEL (Testing erforderlich)
1. **lib/rendering/TileRenderer.ts**
   - Visuell testen: Werden alle Tiles korrekt gerendert?

2. **lib/dungeon/generation.ts**
   - Doppel-Wände Bug testen

3. **components/roomeditor/LayoutCanvas.tsx**
   - Room Editor visuell testen

4. **Tests aktualisieren**
   - Screenshot-Tests
   - Visuelle Regression

### 🟢 NIEDRIG (Nur Monitoring)
1. **lib/rendering/GameRenderer.ts**
   - Sollte automatisch funktionieren

2. **lib/tiletheme/types.ts**
   - Nur Definitionen, keine Änderungen

3. **lib/constants.ts**
   - Re-Exports, keine Änderungen

---

## Änderungs-Reihenfolge

**Empfohlene Reihenfolge:**
1. ✅ Tileset austauschen (physische Datei)
2. ✅ `lib/spriteConfig.ts` - Koordinaten updaten
3. ✅ Visueller Test im Browser (Quick Check)
4. ✅ `lib/tiletheme/WallTypeDetector.ts` - Bug-Fix
5. ✅ Comprehensive Testing (alle betroffenen Bereiche)
6. ✅ Tests aktualisieren (Screenshots, etc.)
7. ✅ Room Editor testen
8. ✅ Finale Abnahme

---

**Nächstes Dokument:** `04-Tile-Koordinaten-Update.md`
