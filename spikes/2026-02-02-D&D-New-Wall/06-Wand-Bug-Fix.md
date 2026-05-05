# Wand-Bug Fix: Doppelte Wände & Fehlende Wände

**Datum:** 2026-02-04
**Datei:** 06-Wand-Bug-Fix.md

---

## Problem-Beschreibung

Es gibt bekannte Bugs in der Wand-Generierung:

1. **Doppelte Wände:** Manche Wände werden doppelt generiert
2. **Fehlende Wände:** An manchen Stellen fehlen Wände
3. **Falsche Wand-Typen:** HORIZONTAL und VERTICAL vertauscht

**Quelle:**
- `lib/tiletheme/WallTypeDetector.ts` (Zeilen 53-81)
- Test: `tests/e2e/dungeon-double-walls.spec.ts`

---

## Root Cause Analysis

### Bug 1: HORIZONTAL/VERTICAL Swap

**Problem:**
```typescript
// FALSCH (alte Version):
if (hasLeft && hasRight) return WALL_TYPE.HORIZONTAL;  // ❌
if (hasTop && hasBottom) return WALL_TYPE.VERTICAL;    // ❌
```

**Erklärung:**
- Eine Wand die **horizontal verläuft** (links → rechts) braucht ein **vertikales Tile** (von oben betrachtet)
- Eine Wand die **vertikal verläuft** (oben → unten) braucht ein **horizontales Tile** (von der Seite betrachtet)

**Korrekte Version** (bereits im Code):
```typescript
// RICHTIG (Zeilen 53-56):
// BUG FIX: Swapped HORIZONTAL and VERTICAL to match tileset orientation
if (hasLeft && hasRight) return WALL_TYPE.VERTICAL;    // ✅ Wall runs left-right → needs vertical tile
if (hasTop && hasBottom) return WALL_TYPE.HORIZONTAL;  // ✅ Wall runs top-bottom → needs horizontal tile
```

**Status:** ✅ **Bereits gefixt im Code** (Kommentar vorhanden)

---

### Bug 2: END_* Swap

**Problem:**
```typescript
// FALSCH (alte Version):
if (hasRight) return WALL_TYPE.END_LEFT;   // ❌
if (hasLeft) return WALL_TYPE.END_RIGHT;   // ❌
if (hasBottom) return WALL_TYPE.END_TOP;   // ❌
if (hasTop) return WALL_TYPE.END_BOTTOM;   // ❌
```

**Korrekte Version** (bereits im Code):
```typescript
// RICHTIG (Zeilen 60-65):
// BUG FIX: Swapped to match vertical/horizontal swap above
if (hasRight) return WALL_TYPE.END_TOP;     // ✅ Swapped from END_LEFT
if (hasLeft) return WALL_TYPE.END_BOTTOM;   // ✅ Swapped from END_RIGHT
if (hasBottom) return WALL_TYPE.END_LEFT;   // ✅ Swapped from END_TOP
if (hasTop) return WALL_TYPE.END_RIGHT;     // ✅ Swapped from END_BOTTOM
```

**Status:** ✅ **Bereits gefixt im Code** (Kommentar vorhanden)

---

### Bug 3: Doppelte Wände in Dungeon-Generierung

**Problem:** Wände werden manchmal doppelt generiert (eine Wand aus Raum A, eine aus Raum B)

**Betroffene Datei:** `lib/dungeon/generation.ts`

**Ursache:** BSP-Algorithmus erstellt Wände für jeden Raum einzeln, ohne zu prüfen ob bereits eine Wand existiert

**Beispiel:**
```
Raum A: [FLOOR][FLOOR][WALL]
Raum B:                [WALL][FLOOR][FLOOR]
                        ^^^^
                     Doppel-Wand!
```

**Potenzielle Lösung:**
1. Nach dem Wand-Hinzufügen: Doppelte Wände entfernen
2. Oder: Wände nur an Raum-Grenzen hinzufügen (nicht pro Raum)

**Code-Stelle (zu untersuchen):**
```typescript
// lib/dungeon/BSPNode.ts - fillRooms() Methode
// Zeilen ~50-100

fillRooms(dungeon: TileType[][], roomMap: number[][], rooms: Room[]) {
  // ... Räume mit FLOOR füllen ...

  // HIER: Wände werden hinzugefügt
  // Potentiell doppelt!
}
```

**Status:** ⚠️ **MUSS UNTERSUCHT WERDEN**

---

### Bug 4: Fehlende Wände

**Problem:** An manchen Stellen fehlen Wände komplett (Löcher im Dungeon)

**Ursache (vermutet):**
- Union-Find Algorithmus verbindet Räume falsch
- Oder: Wand-Removal bei Tür-Platzierung ist zu aggressiv

**Code-Stelle (zu untersuchen):**
```typescript
// lib/dungeon/generation.ts - connectRooms() Methode
// Zeilen ~142-250

connectRooms(dungeon, roomMap, rooms, config) {
  // ... Union-Find Algorithmus ...

  // HIER: Türen werden platziert
  // Dabei werden Wände entfernt - möglicherweise zu viele?
}
```

**Status:** ⚠️ **MUSS UNTERSUCHT WERDEN**

---

## Detaillierte Code-Analyse

### WallTypeDetector.ts

**Datei:** `lib/tiletheme/WallTypeDetector.ts`

#### Funktion: detectWallType()

**Zeilen 19-69: Komplette Analyse**

```typescript
export function detectWallType(
  dungeon: TileType[][],
  x: number,
  y: number
): WallType {
  // 1. Prüfe alle 4 Nachbarn
  const hasTop = isWallOrDoor(dungeon, x, y - 1);
  const hasBottom = isWallOrDoor(dungeon, x, y + 1);
  const hasLeft = isWallOrDoor(dungeon, x - 1, y);
  const hasRight = isWallOrDoor(dungeon, x + 1, y);

  const count = [hasTop, hasBottom, hasLeft, hasRight].filter(Boolean).length;

  // 2. Basierend auf Anzahl der Nachbarn: Wähle Wand-Typ

  // 4 Nachbarn = Kreuzung
  if (count === 4) {
    return WALL_TYPE.CROSS;
  }

  // 3 Nachbarn = T-Stück
  if (count === 3) {
    if (!hasTop) return WALL_TYPE.T_UP;       // ╩
    if (!hasBottom) return WALL_TYPE.T_DOWN;  // ╦
    if (!hasLeft) return WALL_TYPE.T_LEFT;    // ╣
    if (!hasRight) return WALL_TYPE.T_RIGHT;  // ╠
  }

  // 2 Nachbarn = Ecke oder Linear
  if (count === 2) {
    // Ecken (rechter Winkel)
    if (hasRight && hasBottom) return WALL_TYPE.CORNER_TL;  // ╔
    if (hasLeft && hasBottom) return WALL_TYPE.CORNER_TR;   // ╗
    if (hasRight && hasTop) return WALL_TYPE.CORNER_BL;     // ╚
    if (hasLeft && hasTop) return WALL_TYPE.CORNER_BR;      // ╝

    // Linear (gegenüberliegende Seiten)
    // ✅ BUG FIX: Swapped HORIZONTAL and VERTICAL
    if (hasLeft && hasRight) return WALL_TYPE.VERTICAL;     // Wand läuft horizontal → braucht vertikales Tile
    if (hasTop && hasBottom) return WALL_TYPE.HORIZONTAL;   // Wand läuft vertikal → braucht horizontales Tile
  }

  // 1 Nachbar = Ende
  // ✅ BUG FIX: Swapped to match vertical/horizontal swap above
  if (count === 1) {
    if (hasRight) return WALL_TYPE.END_TOP;
    if (hasLeft) return WALL_TYPE.END_BOTTOM;
    if (hasBottom) return WALL_TYPE.END_LEFT;
    if (hasTop) return WALL_TYPE.END_RIGHT;
  }

  // 0 Nachbarn = Isoliert
  return WALL_TYPE.ISOLATED;
}
```

**Analyse:**
- ✅ Logik ist korrekt
- ✅ Swaps sind dokumentiert
- ⚠️ ABER: Funktioniert nur wenn Tileset-Koordinaten auch korrekt sind!

**Action Items:**
1. Prüfe ob neue Tileset-Koordinaten zu dieser Logik passen
2. Validiere visuell: Stimmt HORIZONTAL im Tileset mit der Erwartung überein?

---

### BSPNode.ts (Doppel-Wände)

**Datei:** `lib/dungeon/BSPNode.ts`

**Kritische Methode:** `fillRooms()`

**Problem-Hypothese:**
```typescript
// Pseudocode:
for each room:
  fill room with FLOOR
  add walls around room  // ← HIER: Könnte doppelt sein!
```

**Lösung 1: Wall-Deduplizierung**
```typescript
// Nach dem Wand-Hinzufügen:
function removeDuplicateWalls(dungeon: TileType[][]) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Prüfe: Sind zwei Wände nebeneinander?
      if (dungeon[y][x] === TILE.WALL &&
          dungeon[y][x + 1] === TILE.WALL) {
        // Entferne eine Wand (z.B. die rechte)
        dungeon[y][x + 1] = TILE.EMPTY;
      }
    }
  }
}
```

**Lösung 2: Wand-Generierung anpassen**
```typescript
// Nur Außenwände hinzufügen (nicht zwischen Räumen)
function addWalls(dungeon: TileType[][]) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (dungeon[y][x] === TILE.FLOOR) {
        // Prüfe alle Nachbarn
        // Nur dort Wand hinzufügen wo kein Raum ist
        if (dungeon[y-1][x] === TILE.EMPTY) {
          dungeon[y-1][x] = TILE.WALL;  // Wand oben
        }
        // ... analog für alle Seiten
      }
    }
  }
}
```

**Status:** ⚠️ **CODE-REVIEW NÖTIG**

---

### generation.ts (Fehlende Wände)

**Datei:** `lib/dungeon/generation.ts`

**Kritische Methode:** `connectRooms()` (Zeilen 142-250)

**Problem-Hypothese:**
Beim Platzieren von Türen werden möglicherweise benachbarte Wände auch entfernt.

**Code-Stelle:**
```typescript
// Zeile ~230:
dungeon[connection.y][connection.x] = TILE.DOOR;  // Wand wird zur Tür

// Mögliches Problem: Werden hier auch Nachbar-Tiles geändert?
```

**Test:**
```typescript
// Erstelle Test-Dungeon mit bekannter Struktur
// Platziere Tür
// Prüfe: Sind alle umliegenden Wände noch da?

describe('connectRooms', () => {
  it('should not remove walls adjacent to doors', () => {
    const dungeon = createTestDungeon();
    connectRooms(dungeon, roomMap, rooms);

    // Prüfe: Wände neben Türen existieren noch
    expect(wallsIntact).toBe(true);
  });
});
```

**Status:** ⚠️ **TESTING NÖTIG**

---

## Fix-Plan

### Phase 1: Validierung (ZUERST!)

**Schritt 1.1: Visuelle Inspektion**
1. Spiel starten
2. Mehrere Dungeons generieren (10+)
3. Probleme dokumentieren:
   - Screenshot von Doppel-Wänden
   - Screenshot von fehlenden Wänden
   - Position notieren (x, y Koordinaten)

**Schritt 1.2: Existierende Tests prüfen**
```bash
# Doppel-Wand Tests laufen lassen
npm run test tests/e2e/dungeon-double-walls.spec.ts
npm run test tests/dungeon-double-walls.test.ts

# Erwartung: Tests sollten FEHLSCHLAGEN wenn Bug existiert
```

**Schritt 1.3: Bug reproduzieren**
```typescript
// Erstelle minimalen Testfall
const testDungeon = [
  [WALL, WALL, WALL],
  [WALL, FLOOR, WALL],
  [WALL, WALL, WALL],
];

// Erwartung: Nur 1 Wand-Schicht
// Ist: Möglicherweise doppelte Wände?
```

---

### Phase 2: Fix implementieren

**Nur wenn Bug bestätigt ist!**

**Option 1: Deduplizierung nach Generierung**
```typescript
// In lib/dungeon/generation.ts

export function generateDungeon(config) {
  // ... bestehende Generierung ...

  // NEU: Doppelte Wände entfernen
  removeDuplicateWalls(dungeon);

  return { dungeon, rooms, roomMap };
}

function removeDuplicateWalls(dungeon: TileType[][]) {
  // Implementierung siehe oben
}
```

**Option 2: Wand-Generierung refactorn**
```typescript
// In lib/dungeon/BSPNode.ts

fillRooms(dungeon, roomMap, rooms) {
  // STATT: Wände für jeden Raum hinzufügen
  // NEU: Nur Außenwände hinzufügen
}
```

**Empfehlung:** Option 1 (einfacher, weniger Breaking Changes)

---

### Phase 3: Testing

**Nach dem Fix:**

**Test 1: Unit-Tests**
```bash
npm run test tests/dungeon-double-walls.test.ts
# Erwartung: ✅ PASS
```

**Test 2: E2E-Tests**
```bash
npm run test:e2e tests/e2e/dungeon-double-walls.spec.ts
# Erwartung: ✅ PASS
```

**Test 3: Visuell**
1. Spiel starten
2. 20+ Dungeons generieren
3. Manuell prüfen:
   - Keine Doppel-Wände
   - Keine fehlenden Wände
   - Autotiling funktioniert

**Test 4: Performance**
```typescript
// Vor dem Fix:
console.time('dungeon-generation');
generateDungeon();
console.timeEnd('dungeon-generation');
// Beispiel: 150ms

// Nach dem Fix:
// Sollte ähnlich sein (< 10% Unterschied)
```

---

## Checkliste: Wand-Bugs

**Vor dem Fix:**
- [ ] Doppel-Wände visuell identifiziert (Screenshot)
- [ ] Fehlende Wände visuell identifiziert (Screenshot)
- [ ] Existierende Tests ausgeführt
- [ ] Bug reproduzierbar (minimaler Testfall)
- [ ] Root Cause analysiert

**Während des Fix:**
- [ ] Code-Änderungen dokumentiert
- [ ] Neue Tests geschrieben (falls nötig)
- [ ] Bestehende Tests aktualisiert

**Nach dem Fix:**
- [ ] Unit-Tests: ✅ PASS
- [ ] E2E-Tests: ✅ PASS
- [ ] Visueller Test: ✅ PASS (20+ Dungeons)
- [ ] Performance: ✅ OK (< 10% Unterschied)
- [ ] Keine Regression (alte Features funktionieren)

---

## Wichtige Hinweise

### ⚠️ Koordinaten-Änderung ZUERST!

**WICHTIG:** Bevor du die Wand-Bugs fixst:
1. ✅ Tileset austauschen
2. ✅ Koordinaten in `spriteConfig.ts` anpassen
3. ✅ Visuell testen

**Grund:** Manche "Bugs" könnten nur **visuelle Probleme** sein (falsche Koordinaten), keine echten Logik-Bugs!

---

### Test-Driven Ansatz

**Empfohlen:**
1. Test schreiben der Bug reproduziert (sollte FAIL)
2. Fix implementieren
3. Test erneut laufen lassen (sollte PASS)
4. Refactoring (optional)

**Beispiel:**
```typescript
// tests/dungeon-wall-bugs.test.ts

describe('Wall Generation Bugs', () => {
  it('should not create double walls between rooms', () => {
    const { dungeon, rooms } = generateDungeon();

    const doubleWalls = findDoubleWalls(dungeon);
    expect(doubleWalls.length).toBe(0);  // Erwartung: Keine Doppel-Wände
  });
});
```

---

**Nächstes Dokument:** `07-Testing-Strategie.md`
