# Tilemap Editor - Preview End Piece Fix

**Datum**: 2026-02-04
**Autor**: Claude (Michi)
**Status**: ✅ Behoben

## Problem-Beschreibung

Der Benutzer hat gemeldet, dass die Preview im Tilemap-Editor (`/tilemapeditor`) nach korrektem Ausfüllen aller Slots laut Plan immer noch nicht korrekt aussieht.

**Symptom**: Nach dem Ausfüllen aller Wall-, Floor- und Door-Slots werden die End Pieces (Wand-Enden) in der Preview falsch dargestellt.

**Ursache**: Bei der vorherigen Korrektur der HORIZONTAL/VERTICAL-Orientierung (siehe `2026-02-04-tilemapeditor-label-fixes.md`) wurde die End Piece Detection-Logik fälschlicherweise mit-vertauscht, obwohl sie unverändert bleiben sollte.

## Root Cause Analyse

### Das HORIZONTAL/VERTICAL Swap-System

**Nach dem Swap (Zeilen 54-55 in WallTypeDetector.ts)**:
```typescript
if (hasLeft && hasRight) return WALL_TYPE.VERTICAL;    // Left-right wall → horizontal-looking tiles
if (hasTop && hasBottom) return WALL_TYPE.HORIZONTAL;  // Top-bottom wall → vertical-looking tiles
```

**Bedeutung**:
- `WALL_TYPE.HORIZONTAL` = Slot für **vertikal aussehende Tiles** (`║`) → verwendet für **top-bottom Wände**
- `WALL_TYPE.VERTICAL` = Slot für **horizontal aussehende Tiles** (`═══`) → verwendet für **left-right Wände**

### End Piece Naming Logic

**End Piece Namen** beziehen sich auf die **Position des ENDES**, nicht die **Richtung der Wand**:

- `END_LEFT`: Ende ist auf der LINKEN Seite → Wand erstreckt sich nach RECHTS → horizontal orientiert
- `END_RIGHT`: Ende ist auf der RECHTEN Seite → Wand erstreckt sich nach LINKS → horizontal orientiert
- `END_TOP`: Ende ist OBEN → Wand erstreckt sich nach UNTEN → vertikal orientiert
- `END_BOTTOM`: Ende ist UNTEN → Wand erstreckt sich nach OBEN → vertikal orientiert

### Das Problem

**Vor dem Fix** (FALSCH):
```typescript
// Zeilen 61-64 (FALSCH)
if (hasRight) return WALL_TYPE.END_TOP;     // ❌ Wand mit Nachbar RECHTS → Ende LINKS
if (hasLeft) return WALL_TYPE.END_BOTTOM;   // ❌ Wand mit Nachbar LINKS → Ende RECHTS
if (hasBottom) return WALL_TYPE.END_LEFT;   // ❌ Wand mit Nachbar UNTEN → Ende OBEN
if (hasTop) return WALL_TYPE.END_RIGHT;     // ❌ Wand mit Nachbar OBEN → Ende UNTEN
```

**Problem**: Die Detection Logic war komplett vertauscht!

**Beispiel**:
```
F F F
F W═F  (Wand mit Nachbar RECHTS)
F F F
```
- Wand erstreckt sich nach RECHTS (horizontal)
- Ende ist auf der LINKEN Seite
- Sollte `END_LEFT` zurückgeben
- **ABER**: Code gab `END_TOP` zurück ❌
- `END_TOP` hat Fallback zu `HORIZONTAL` (vertikal aussehende Tiles `║`)
- **Ergebnis**: Horizontale Wand wurde mit vertikalem Tile gerendert! ❌

## Die Lösung

### Fix 1: End Piece Detection Logic korrigiert

**Datei**: `lib/tiletheme/WallTypeDetector.ts` (Zeilen 59-66)

**VORHER** (FALSCH):
```typescript
if (count === 1) {
  if (hasRight) return WALL_TYPE.END_TOP;     // ❌
  if (hasLeft) return WALL_TYPE.END_BOTTOM;   // ❌
  if (hasBottom) return WALL_TYPE.END_LEFT;   // ❌
  if (hasTop) return WALL_TYPE.END_RIGHT;     // ❌
}
```

**NACHHER** (KORREKT):
```typescript
if (count === 1) {
  if (hasRight) return WALL_TYPE.END_LEFT;    // ✅ Wall extends right, end is on left
  if (hasLeft) return WALL_TYPE.END_RIGHT;    // ✅ Wall extends left, end is on right
  if (hasBottom) return WALL_TYPE.END_TOP;    // ✅ Wall extends down, end is on top
  if (hasTop) return WALL_TYPE.END_BOTTOM;    // ✅ Wall extends up, end is on bottom
}
```

### Fix 2: Fallback-Mapping (blieb unverändert)

**Datei**: `lib/tiletheme/WallTypeDetector.ts` (Zeilen 72-86)

Die Fallbacks waren **bereits korrekt** und mussten **nicht** geändert werden:

```typescript
export const WALL_TYPE_FALLBACKS: { [key in WallType]?: WallType } = {
  [WALL_TYPE.ISOLATED]: WALL_TYPE.VERTICAL,
  [WALL_TYPE.END_LEFT]: WALL_TYPE.VERTICAL,      // ✅ Horizontal-looking tile (═) → VERTICAL slot
  [WALL_TYPE.END_RIGHT]: WALL_TYPE.VERTICAL,     // ✅ Horizontal-looking tile (═) → VERTICAL slot
  [WALL_TYPE.END_TOP]: WALL_TYPE.HORIZONTAL,     // ✅ Vertical-looking tile (║) → HORIZONTAL slot
  [WALL_TYPE.END_BOTTOM]: WALL_TYPE.HORIZONTAL,  // ✅ Vertical-looking tile (║) → HORIZONTAL slot
};
```

**Erklärung der Fallbacks im Swapped System**:
- `END_LEFT` und `END_RIGHT` verwenden Tiles die wie `═` aussehen (horizontal)
- Im Swapped System sind horizontal aussehende Tiles im `VERTICAL` Slot
- → Daher Fallback zu `VERTICAL` ✅

- `END_TOP` und `END_BOTTOM` verwenden Tiles die wie `║` aussehen (vertikal)
- Im Swapped System sind vertikal aussehende Tiles im `HORIZONTAL` Slot
- → Daher Fallback zu `HORIZONTAL` ✅

## Test-Ergebnisse

### Unit-Tests: ✅ **13 von 13 Tests bestehen**

**Datei**: `tests/unit/wall-end-piece-detection.test.ts` (NEU)

```bash
npx vitest run tests/unit/wall-end-piece-detection.test.ts
```

**Test-Abdeckung**:

1. **End Piece Detection Logic** (4 Tests):
   - ✅ Returns END_LEFT when wall has neighbor to RIGHT only
   - ✅ Returns END_RIGHT when wall has neighbor to LEFT only
   - ✅ Returns END_TOP when wall has neighbor BELOW only
   - ✅ Returns END_BOTTOM when wall has neighbor ABOVE only

2. **End Piece Fallbacks (Swapped System)** (4 Tests):
   - ✅ END_LEFT fallbacks to VERTICAL (horizontal-looking tile)
   - ✅ END_RIGHT fallbacks to VERTICAL (horizontal-looking tile)
   - ✅ END_TOP fallbacks to HORIZONTAL (vertical-looking tile)
   - ✅ END_BOTTOM fallbacks to HORIZONTAL (vertical-looking tile)

3. **Main Wall Types (Verification)** (2 Tests):
   - ✅ Returns VERTICAL for left-right walls
   - ✅ Returns HORIZONTAL for top-bottom walls

4. **Complex Scenarios** (3 Tests):
   - ✅ Correctly detects end pieces in a horizontal corridor
   - ✅ Correctly detects end pieces in a vertical corridor
   - ✅ Detects isolated wall correctly

**Ergebnis**:
```
✓ tests/unit/wall-end-piece-detection.test.ts (13 tests) 7ms
  Test Files  1 passed (1)
       Tests  13 passed (13)
```

## Betroffene Dateien

1. **`lib/tiletheme/WallTypeDetector.ts`**:
   - Zeilen 59-66: End Piece Detection Logic korrigiert
   - Zeilen 72-86: Fallback-Kommentare verdeutlicht (Logik unverändert)

2. **`tests/unit/wall-end-piece-detection.test.ts`** (NEU):
   - 13 Unit-Tests für End Piece Detection

3. **`docs/Tasks/04_Archive/2026-02-04-tilemapeditor-preview-endpiece-fix.md`** (NEU):
   - Diese Dokumentation

## Vorher/Nachher Vergleich

### Vorher ❌:

**Horizontale Wand mit Ende links**:
```
F F F
F W═F  (Wand mit Nachbar RECHTS)
F F F
```
- Detection gab `END_TOP` zurück (FALSCH)
- Fallback zu `HORIZONTAL` (vertikal aussehende Tiles `║`)
- **Gerendert**: `║` (FALSCH! Sollte `═` sein)

**Vertikale Wand mit Ende oben**:
```
F F F
F W F  (Wand mit Nachbar UNTEN)
F ║ F
```
- Detection gab `END_LEFT` zurück (FALSCH)
- Fallback zu `VERTICAL` (horizontal aussehende Tiles `═`)
- **Gerendert**: `═` (FALSCH! Sollte `║` sein)

### Nachher ✅:

**Horizontale Wand mit Ende links**:
```
F F F
F W═F  (Wand mit Nachbar RECHTS)
F F F
```
- Detection gibt `END_LEFT` zurück ✅
- Fallback zu `VERTICAL` (horizontal aussehende Tiles `═══`)
- **Gerendert**: `═` ✅

**Vertikale Wand mit Ende oben**:
```
F F F
F W F  (Wand mit Nachbar UNTEN)
F ║ F
```
- Detection gibt `END_TOP` zurück ✅
- Fallback zu `HORIZONTAL` (vertikal aussehende Tiles `║`)
- **Gerendert**: `║` ✅

## Technische Details

### Detection-Logik Ablauf

**Beispiel**: Wand bei Position (1, 1) mit Nachbar RECHTS nur

```
dungeon = [
  [FLOOR, FLOOR, FLOOR],
  [FLOOR, WALL,  WALL],  // Position (1,1) hat Nachbar bei (2,1)
  [FLOOR, FLOOR, FLOOR]
]
```

**Schritte**:
1. `hasRight = true` (Wand bei x+1)
2. `hasLeft = false`, `hasTop = false`, `hasBottom = false`
3. `count = 1` (nur 1 Nachbar)
4. `if (hasRight)` → `return WALL_TYPE.END_LEFT` ✅
5. Fallback-Lookup: `END_LEFT` → `VERTICAL`
6. Tile-Selection: Wähle Tile aus `theme.wall.vertical` Slot
7. Rendering: Zeichne horizontal aussehendes Tile `═`

### Warum der ursprüngliche Swap falsch war

Bei der ersten Korrektur wurde gedacht:
> "Wenn wir HORIZONTAL und VERTICAL vertauschen, müssen wir auch die End Pieces vertauschen"

**ABER**: Das ist FALSCH!

Die End Piece **Detection** hängt nur von den **Nachbar-Positionen** ab, nicht von der **Tile-Orientierung**. Die Tile-Orientierung wird durch das **Fallback-Mapping** bestimmt.

**Korrekte Regel**:
- Detection-Logik: Basiert auf Nachbar-Positionen (unverändert)
- Fallback-Mapping: Basiert auf Tile-Orientierung (bereits korrekt nach Swap)

## Manuelle Verifikation

### Test-Schritte:

1. **Tilemap Editor öffnen**:
   ```
   http://localhost:3000/tilemapeditor
   ```

2. **Neues Theme erstellen**:
   - "Neu" Button klicken
   - Theme-Name eingeben

3. **Alle Slots ausfüllen**:
   - Floor Slot: Beliebiges Floor-Tile
   - Wall ↕ (top-bottom): Vertikal aussehendes Tile (`║`)
   - Wall ↔ (left-right): Horizontal aussehendes Tile (`═══`)
   - Alle Corner-, T-Piece-, Cross-Slots befüllen
   - Optional: End Pieces befüllen (END_LEFT/RIGHT mit `═`, END_TOP/BOTTOM mit `║`)
   - Alle Door-Slots befüllen

4. **Preview prüfen (rechts)**:
   - [ ] Horizontale Wände verwenden horizontale Tiles (`═══`)
   - [ ] Vertikale Wände verwenden vertikale Tiles (`║`)
   - [ ] End Pieces sind korrekt orientiert:
     - Horizontale Enden verwenden `═`
     - Vertikale Enden verwenden `║`
   - [ ] Keine rosa Fehlertiles

5. **Ingame Test**:
   - Theme speichern
   - Neues Spiel starten
   - Dungeon generieren lassen
   - [ ] Wände sehen korrekt aus
   - [ ] Keine falsch orientierten End Pieces

## Git Commit

```bash
# Empfohlene Commit-Message:
fix: correct wall end piece detection in tilemap editor preview

- Fix end piece detection logic in WallTypeDetector.ts (lines 59-66)
- Revert incorrect swap of END_LEFT/RIGHT/TOP/BOTTOM detection
- Keep fallback mappings unchanged (already correct after HORIZONTAL/VERTICAL swap)
- Add comprehensive unit tests (13 tests, all passing)

The issue: When HORIZONTAL and VERTICAL wall types were swapped to fix orientation,
the end piece detection was incorrectly swapped as well. End piece detection
depends on neighbor positions (unchanged), not tile orientation (handled by fallbacks).

Correct logic:
- Wall with RIGHT neighbor → END_LEFT (end is on left, wall extends right)
- Wall with LEFT neighbor → END_RIGHT (end is on right, wall extends left)
- Wall with BOTTOM neighbor → END_TOP (end is on top, wall extends down)
- Wall with TOP neighbor → END_BOTTOM (end is on bottom, wall extends up)

Fallbacks remain correct:
- END_LEFT/RIGHT → VERTICAL (horizontal-looking tiles)
- END_TOP/BOTTOM → HORIZONTAL (vertical-looking tiles)

This fixes the tilemap editor preview showing incorrectly oriented end pieces.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Zusammenhang mit vorherigen Fixes

### Timeline:

1. **2026-02-04 (Erster Fix)**: Tilemap Editor Labels korrigiert
   - Datei: `docs/Tasks/04_Archive/2026-02-04-tilemapeditor-label-fixes.md`
   - Fixed: Labels und Symbole vertauscht (↕ ↔)
   - Swap: `HORIZONTAL` ↔ `VERTICAL` in Detection-Logik (Zeilen 54-55)
   - **FEHLER**: End Pieces fälschlicherweise mit-vertauscht

2. **2026-02-04 (Zweiter Fix)**: End Piece Detection korrigiert (**DIESER FIX**)
   - Datei: `docs/Tasks/04_Archive/2026-02-04-tilemapeditor-preview-endpiece-fix.md`
   - Fixed: End Piece Detection zurück auf Original
   - Kept: Fallback-Mappings unverändert (bereits korrekt)

### Lessons Learned:

**Regel für zukünftige Orientation-Swaps**:
- Detection-Logik: Nur **lineare Wände** (HORIZONTAL/VERTICAL) swappen
- End Pieces: Detection **NICHT** swappen (basiert auf Nachbar-Positionen)
- Fallbacks: End Pieces **automatisch korrekt** nach Swap (basiert auf Tile-Aussehen)

## Nächste Schritte

1. ✅ End Piece Detection Logic korrigiert
2. ✅ Fallback-Kommentare verdeutlicht
3. ✅ Unit-Tests erstellt (13 Tests, alle bestehen)
4. **TODO**: Manuelle Verifikation im Browser (Preview prüfen)
5. **TODO**: Ingame Test (Theme speichern und im Spiel testen)
6. **TODO**: Code committen (Commit-Message oben verwenden)

## Fazit

Der Fehler in der Preview wurde erfolgreich behoben:

1. ✅ **End Piece Detection** - Korrekt basierend auf Nachbar-Positionen
2. ✅ **Fallback-Mappings** - Bereits korrekt nach HORIZONTAL/VERTICAL Swap
3. ✅ **13 Unit-Tests** - Vollständige Abdeckung aller End Piece Szenarien
4. ✅ **Dokumentation** - Klare Erklärung des Problems und der Lösung

Die Preview im Tilemap Editor sollte jetzt korrekt aussehen, wenn alle Slots nach Plan befüllt werden.
