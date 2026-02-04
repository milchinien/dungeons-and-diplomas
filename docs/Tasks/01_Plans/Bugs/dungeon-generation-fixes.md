# Dungeon Generation Fixes & Spawn-Raum System

**Datum:** 2026-02-03
**Bearbeiter:** Claude (Senior Dev)
**Status:** In Planung
**Priorität:** Hoch

---

## 📋 Zusammenfassung

Behebung aller Wand- und Türprobleme in der Dungeon-Generierung sowie Implementierung eines neuen Spawn-Raum-Systems mit 3-Wege-Struktur, die zu einem gemeinsamen Endraum führt.

---

## 🎯 Hauptziele

1. ✅ **Wand-Probleme beheben**: Alle Wand-Ausrichtungsprobleme identifizieren und korrigieren
2. ✅ **Tür-Validierung**: Sicherstellen dass hinter jeder Tür ein begehbarer Raum ist
3. ✅ **Spawn-Raum System**: Neuer Raumtyp "spawn" mit genau 3 Türen (Nord, Ost, West)
4. ✅ **End-Raum System**: Neuer Raumtyp "end" wo alle 3 Wege zusammenlaufen
5. ✅ **3-Wege-Generierung**: Dungeon mit 3 separaten Pfaden vom Spawn zum End-Raum
6. ✅ **Sackgassen-Unterstützung**: Automatische Nutzung von Räumen mit nur 1 Tür

---

## 📝 Implementierungsplan (10 Schritte)

### **Phase 1: Analyse & Vorbereitung** (Schritte 1-2)

#### **Schritt 1: Codebase-Analyse & Problem-Identifikation**

**Ziel:** Alle aktuellen Wand- und Türprobleme systematisch identifizieren

**Vorgehensweise:**
- Explore-Agent einsetzen für Analyse:
  - `lib/dungeon/layoutGeneration.ts` - Layout-basierte Generierung
  - `lib/rendering/TileRenderer.ts` - Wand-Rendering
  - `lib/rendering/GameRenderer.ts` - Tür-Rendering
  - `lib/tiletheme/WallTypeDetector.ts` - Wand-Typ-Erkennung
  - Existierende Tests prüfen: `tests/e2e/dungeon-*.spec.ts`

**Zu prüfende Probleme:**
1. **Wandausrichtung:**
   - Werden horizontale Wände als horizontal gerendert?
   - Werden vertikale Wände als vertikal gerendert?
   - `detectDoorType()` Logik korrekt?
   - `WallTypeDetector` findet richtige Wandtypen?

2. **Doppelte Wände:**
   - `removeDoubleWalls()` funktioniert korrekt?
   - Werden Wände auf shared walls übersprungen?
   - Sind nach Generierung noch doppelte Wände vorhanden?

3. **Türen ohne Raum dahinter:**
   - `canPlaceRoom()` prüft Türpositionen?
   - Werden offene Türen auf ungültige Räume platziert?
   - Kollisionserkennung für Türdurchgänge korrekt?

**Erwartete Fehler & Lösungen:**
- **Fehler 1:** `detectDoorType()` erkennt Orientierung falsch
  - **Lösung:** Nachbarn-Check in beide Richtungen verbessern
- **Fehler 2:** `removeDoubleWalls()` übersieht bestimmte Muster
  - **Lösung:** Zusätzliche Scan-Logik für Ecken und L-Formen
- **Fehler 3:** Türen werden platziert ohne Raum-Validierung
  - **Lösung:** Pre-Validierung in `placeRoomInDungeon()`

**Test-Strategie:**
- Unit-Tests für Wand-Erkennung schreiben
- Visual-Tests mit Playwright für Türdurchgänge
- Generiere 50 Dungeons, prüfe jede Tür manuell (automatisiert)

---

#### **Schritt 2: Room-Editor Erweiterungen (Neue Raumtypen)**

**Ziel:** Neue Raumtypen "spawn" und "end" im Room-Editor hinzufügen

**Dateien:**
- `lib/roomlayouts/types.ts` - Typ-Definitionen erweitern
- `lib/db/roomLayouts.ts` - Validierung für neue Typen
- `components/roomeditor/LayoutSettings.tsx` - UI für Typ-Auswahl
- `lib/roomlayouts/validation.ts` - Spezielle Validierung

**Änderungen:**

**1. Type Definition (types.ts):**
```typescript
// Alt:
roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'any';

// Neu:
roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'spawn' | 'end' | 'any';
```

**2. Spawn-Raum Validierung (validation.ts):**
```typescript
export function validateSpawnRoom(layout: RoomLayout): ValidationResult {
  // Muss genau 3 Türen haben
  const doorCount = [
    layout.doorPositions.north !== null,
    layout.doorPositions.south !== null,
    layout.doorPositions.east !== null,
    layout.doorPositions.west !== null
  ].filter(Boolean).length;

  if (doorCount !== 3) {
    return { valid: false, error: 'Spawn-Raum muss genau 3 Türen haben' };
  }

  // Muss Nord, Ost, West haben (Süd muss null sein)
  if (layout.doorPositions.north === null ||
      layout.doorPositions.east === null ||
      layout.doorPositions.west === null ||
      layout.doorPositions.south !== null) {
    return {
      valid: false,
      error: 'Spawn-Raum muss Türen in Nord, Ost und West haben (nicht Süd)'
    };
  }

  return { valid: true };
}
```

**3. End-Raum Validierung:**
```typescript
export function validateEndRoom(layout: RoomLayout): ValidationResult {
  // Muss mindestens 3 Türen haben (für die 3 Wege)
  const doorCount = [
    layout.doorPositions.north !== null,
    layout.doorPositions.south !== null,
    layout.doorPositions.east !== null,
    layout.doorPositions.west !== null
  ].filter(Boolean).length;

  if (doorCount < 3) {
    return {
      valid: false,
      error: 'End-Raum muss mindestens 3 Türen haben (für 3 Wege)'
    };
  }

  return { valid: true };
}
```

**4. UI Anpassungen (LayoutSettings.tsx):**
- Dropdown mit neuen Optionen: "Spawn Room" und "End Room"
- Info-Text bei "spawn": "Muss genau 3 Türen haben (Nord, Ost, West)"
- Info-Text bei "end": "Muss mindestens 3 Türen haben"
- Live-Validierung beim Zeichnen

**5. Seed-Layouts erstellen:**
- Mindestens 3 verschiedene Spawn-Raum-Layouts
- Mindestens 2 verschiedene End-Raum-Layouts
- In `lib/data/seed-room-layouts.json` hinzufügen

**Test-Strategie:**
- Unit-Test für Validierungsfunktionen
- E2E-Test: Spawn-Raum im Editor erstellen, speichern, laden
- E2E-Test: End-Raum mit 3+ Türen validieren

**Mögliche Bugs:**
- **Bug:** Validierung schlägt fehl bei korrektem Layout
  - **Fix:** Door-Position-Check doppelt prüfen
- **Bug:** UI zeigt falsche Fehlermeldung
  - **Fix:** Error-Messages in LayoutSettings richtig anzeigen

---

### **Phase 2: Wand- & Tür-Fixes** (Schritte 3-4)

#### **Schritt 3: Wand-Ausrichtung & Rendering korrigieren**

**Ziel:** Alle Wände werden mit korrekter Orientierung gerendert

**Problem-Analyse:**

1. **WallTypeDetector.ts - Orientierung:**
```typescript
// Aktuell:
export function detectDoorType(
  dungeon: TileType[][],
  x: number,
  y: number,
  isOpen: boolean
): DoorVariant {
  // Prüft nur links/rechts für horizontal
  const hasFloorLeft = x > 0 && dungeon[y][x - 1] === TILE.FLOOR;
  const hasFloorRight = x < dungeon[0].length - 1 && dungeon[y][x + 1] === TILE.FLOOR;

  // Problem: Was wenn Tür in Ecke oder komplexe Geometrie?
}
```

**Verbesserungen:**
- Alle 4 Richtungen prüfen (nicht nur 2)
- Diagonale Nachbarn berücksichtigen
- Robustere Erkennung bei L-Formen und T-Kreuzungen

**Neue Implementierung:**
```typescript
export function detectWallOrientation(
  dungeon: TileType[][],
  x: number,
  y: number
): 'horizontal' | 'vertical' | 'corner' | 'junction' {
  const neighbors = {
    top: y > 0 ? dungeon[y - 1][x] : TILE.EMPTY,
    bottom: y < dungeon.length - 1 ? dungeon[y + 1][x] : TILE.EMPTY,
    left: x > 0 ? dungeon[y][x - 1] : TILE.EMPTY,
    right: x < dungeon[0].length - 1 ? dungeon[y][x + 1] : TILE.EMPTY
  };

  const floorCount = {
    top: neighbors.top === TILE.FLOOR || neighbors.top === TILE.DOOR,
    bottom: neighbors.bottom === TILE.FLOOR || neighbors.bottom === TILE.DOOR,
    left: neighbors.left === TILE.FLOOR || neighbors.left === TILE.DOOR,
    right: neighbors.right === TILE.FLOOR || neighbors.right === TILE.DOOR
  };

  // Horizontal: Boden links UND rechts
  if (floorCount.left && floorCount.right && !floorCount.top && !floorCount.bottom) {
    return 'horizontal';
  }

  // Vertikal: Boden oben UND unten
  if (floorCount.top && floorCount.bottom && !floorCount.left && !floorCount.right) {
    return 'vertical';
  }

  // Ecke: Genau 2 angrenzende Böden
  const totalFloors = Object.values(floorCount).filter(Boolean).length;
  if (totalFloors === 2) return 'corner';

  // Junction: 3+ angrenzende Böden
  if (totalFloors >= 3) return 'junction';

  // Default: horizontal
  return 'horizontal';
}
```

**Dateien:**
- `lib/tiletheme/WallTypeDetector.ts` - Neue Erkennungslogik
- `lib/rendering/TileRenderer.ts` - Nutzung der neuen Funktion
- `lib/tiletheme/WallTileset.ts` - Richtige Tiles für jede Orientierung

**Test-Strategie:**
- Unit-Tests für alle Wand-Konstellationen:
  - Horizontale Wand (links/rechts Boden)
  - Vertikale Wand (oben/unten Boden)
  - Ecke (2 Böden in L-Form)
  - T-Kreuzung (3 Böden)
  - X-Kreuzung (4 Böden)
- Visual-Test: Generiere Dungeon, screenshot, prüfe Wandausrichtung

**Mögliche Bugs:**
- **Bug:** Tür wird als Wand erkannt
  - **Fix:** TILE.DOOR explizit in Nachbar-Check einbeziehen
- **Bug:** Ecken werden als horizontale Wände gerendert
  - **Fix:** Corner-Typ mit speziellem Tile-Set rendern

---

#### **Schritt 4: Tür-Validierung & Raum-Konnektivität**

**Ziel:** Jede Tür hat garantiert einen begehbaren Raum auf beiden Seiten

**Problem-Analyse:**

Aktuell in `layoutGeneration.ts`:
```typescript
function placeRoomInDungeon(...) {
  // Kopiert Tiles ohne zu prüfen ob Tür wirklich verbunden ist
  dungeon[dungeonY][dungeonX] = tile;
}
```

**Neue Validierung:**
```typescript
function validateDoorConnection(
  dungeon: TileType[][],
  doorX: number,
  doorY: number,
  doorSide: 'north' | 'south' | 'east' | 'west'
): boolean {
  // Prüfe ob auf beiden Seiten der Tür ein FLOOR ist

  let side1: TileType | undefined;
  let side2: TileType | undefined;

  if (doorSide === 'north' || doorSide === 'south') {
    // Tür ist horizontal → prüfe links und rechts
    side1 = doorX > 0 ? dungeon[doorY][doorX - 1] : undefined;
    side2 = doorX < dungeon[0].length - 1 ? dungeon[doorY][doorX + 1] : undefined;
  } else {
    // Tür ist vertikal → prüfe oben und unten
    side1 = doorY > 0 ? dungeon[doorY - 1][doorX] : undefined;
    side2 = doorY < dungeon.length - 1 ? dungeon[doorY + 1][doorX] : undefined;
  }

  // Beide Seiten müssen FLOOR oder leer (für zukünftige Räume) sein
  const valid = (
    (side1 === TILE.FLOOR || side1 === TILE.EMPTY) &&
    (side2 === TILE.FLOOR || side2 === TILE.EMPTY)
  );

  if (!valid) {
    console.warn(
      `Invalid door at (${doorX}, ${doorY}): ` +
      `side1=${side1}, side2=${side2}`
    );
  }

  return valid;
}
```

**Integration in Generierung:**
```typescript
function placeRoomInDungeon(...) {
  // ... existing code ...

  // Nach dem Platzieren: Validiere alle Türen
  const invalidDoors: Array<{x: number, y: number}> = [];

  for (let ly = 0; ly < layout.height; ly++) {
    for (let lx = 0; lx < layout.width; lx++) {
      const tile = layout.tileGrid[ly][lx];
      const dungeonX = x + lx;
      const dungeonY = y + ly;

      if (tile === TILE.DOOR) {
        const side = getDoorSide(lx, ly, layout.width, layout.height);
        if (!validateDoorConnection(dungeon, dungeonX, dungeonY, side)) {
          invalidDoors.push({ x: dungeonX, y: dungeonY });
        }
      }
    }
  }

  // Entferne ungültige Türen (ersetze mit Wand)
  for (const door of invalidDoors) {
    dungeon[door.y][door.x] = TILE.WALL;
    console.log(`Removed invalid door at (${door.x}, ${door.y})`);
  }
}
```

**Post-Generation Scan:**
```typescript
export function validateAllDoors(
  dungeon: TileType[][],
  rooms: Room[]
): Array<{x: number, y: number, error: string}> {
  const errors: Array<{x: number, y: number, error: string}> = [];

  for (let y = 0; y < dungeon.length; y++) {
    for (let x = 0; x < dungeon[0].length; x++) {
      if (dungeon[y][x] === TILE.DOOR) {
        // Prüfe alle 4 Richtungen
        const neighbors = {
          top: y > 0 ? dungeon[y - 1][x] : TILE.EMPTY,
          bottom: y < dungeon.length - 1 ? dungeon[y + 1][x] : TILE.EMPTY,
          left: x > 0 ? dungeon[y][x - 1] : TILE.EMPTY,
          right: x < dungeon[0].length - 1 ? dungeon[y][x + 1] : TILE.EMPTY
        };

        // Mind. 2 angrenzende Floors (für Durchgang)
        const floorCount = Object.values(neighbors).filter(
          n => n === TILE.FLOOR
        ).length;

        if (floorCount < 2) {
          errors.push({
            x, y,
            error: `Door has only ${floorCount} adjacent floor(s)`
          });
        }

        // Keine Wand direkt dahinter
        if (neighbors.top === TILE.WALL && neighbors.bottom === TILE.WALL) {
          errors.push({ x, y, error: 'Door blocked by walls (vertical)' });
        }
        if (neighbors.left === TILE.WALL && neighbors.right === TILE.WALL) {
          errors.push({ x, y, error: 'Door blocked by walls (horizontal)' });
        }
      }
    }
  }

  return errors;
}
```

**Dateien:**
- `lib/dungeon/layoutGeneration.ts` - Neue Validierungsfunktionen
- `lib/dungeon/doorValidation.ts` - Neue Datei für Tür-Logik
- `tests/door-validation.test.ts` - Unit-Tests

**Test-Strategie:**
- Unit-Test: Tür zwischen zwei Räumen → valid
- Unit-Test: Tür mit Wand dahinter → invalid, wird entfernt
- E2E-Test: Generiere 100 Dungeons, alle Türen begehbar
- Playwright: Laufe durch jede Tür, keine Kollision

**Mögliche Bugs:**
- **Bug:** Tür wird fälschlicherweise als invalid markiert
  - **Fix:** TILE.EMPTY als gültig akzeptieren (für zukünftige Räume)
- **Bug:** Entfernen von Tür macht Dungeon unzusammenhängend
  - **Fix:** Nach Entfernung erneut Konnektivität prüfen (Union-Find)

---

### **Phase 3: Spawn-Raum & 3-Wege-Generierung** (Schritte 5-7)

#### **Schritt 5: Spawn-Raum Generierung**

**Ziel:** Dungeon startet immer mit einem Spawn-Raum (Typ "spawn") mit 3 Türen

**Algorithmus:**

```typescript
export function generateDungeonWithSpawnRoom(
  targetRoomCount: number = 20,
  seed?: number
): {
  dungeon: TileType[][];
  rooms: Room[];
  roomMap: number[][];
} {
  const pool = getLayoutPool();

  // Schritt 1: Wähle zufälligen Spawn-Raum
  const spawnLayouts = pool.getLayouts({ roomType: 'spawn' });

  if (spawnLayouts.length === 0) {
    throw new Error('No spawn room layouts available. Please create spawn rooms in editor.');
  }

  const spawnLayout = spawnLayouts[Math.floor(Math.random() * spawnLayouts.length)];

  console.log(`[Dungeon] Selected spawn room: ${spawnLayout.name}`);

  // Schritt 2: Platziere Spawn-Raum in der Mitte
  const startX = Math.floor((DUNGEON_WIDTH - spawnLayout.width) / 2);
  const startY = Math.floor((DUNGEON_HEIGHT - spawnLayout.height) / 2);

  // Initialize dungeon
  const dungeon: TileType[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
    Array(DUNGEON_WIDTH).fill(TILE.EMPTY)
  );

  const roomMap: number[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
    Array(DUNGEON_WIDTH).fill(-1)
  );

  const rooms: Room[] = [];
  const placedRooms: PlacedRoom[] = [];
  const openDoors: DoorConnection[] = [];

  // Platziere Spawn-Raum
  placeRoomInDungeon(
    dungeon, roomMap, spawnLayout, startX, startY, 0,
    placedRooms, openDoors, rooms, undefined
  );

  // Markiere als Spawn-Raum
  rooms[0].type = 'spawn';
  rooms[0].visible = true;
  rooms[0].state = 'exploring';

  console.log(`[Dungeon] Spawn room placed at (${startX}, ${startY})`);
  console.log(`[Dungeon] Open doors from spawn: ${openDoors.length}`);
  console.log(`Door directions: ${openDoors.map(d => d.side).join(', ')}`);

  // Schritt 3: Generiere 3 separate Pfade (Nord, Ost, West)
  const paths = generateThreePaths(
    dungeon, roomMap, rooms, placedRooms, openDoors, pool
  );

  // Schritt 4: Platziere End-Raum
  const endRoom = placeEndRoom(
    dungeon, roomMap, rooms, placedRooms, paths, pool
  );

  // Schritt 5: Verbinde Pfade mit End-Raum
  connectPathsToEndRoom(dungeon, roomMap, rooms, paths, endRoom);

  // Schritt 6: Post-Processing
  removeDoubleWalls(dungeon, rooms);
  assignRoomTypes(rooms);

  // Validierung
  const doorErrors = validateAllDoors(dungeon, rooms);
  if (doorErrors.length > 0) {
    console.warn(`[Dungeon] ${doorErrors.length} door validation errors:`, doorErrors);
  }

  return { dungeon, rooms, roomMap };
}
```

**Pfad-Generierung:**
```typescript
interface Path {
  doorConnection: DoorConnection;  // Start-Tür vom Spawn-Raum
  rooms: number[];                  // Raum-IDs im Pfad
  endDoor: DoorConnection | null;   // Tür zum End-Raum
  length: number;                   // Anzahl Räume
}

function generateThreePaths(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[],
  placedRooms: PlacedRoom[],
  openDoors: DoorConnection[],
  pool: LayoutPool
): Path[] {
  // Filter: Nur Türen vom Spawn-Raum (roomId = 0)
  const spawnDoors = openDoors.filter(d => d.roomId === 0);

  if (spawnDoors.length !== 3) {
    throw new Error(`Spawn room must have exactly 3 doors, found ${spawnDoors.length}`);
  }

  const paths: Path[] = [];

  // Für jede Tür: Generiere einen Pfad
  for (const spawnDoor of spawnDoors) {
    const path: Path = {
      doorConnection: spawnDoor,
      rooms: [],
      endDoor: null,
      length: 0
    };

    // Zufällige Pfad-Länge (5-10 Räume)
    const targetLength = 5 + Math.floor(Math.random() * 6);

    let currentDoor = spawnDoor;
    let attempts = 0;
    const maxAttempts = 100;

    while (path.rooms.length < targetLength && attempts < maxAttempts) {
      attempts++;

      // Hole Raum für diese Tür
      const oppositeSide = getOppositeSide(currentDoor.side);
      const newLayout = pool.getLayoutWithDoor(oppositeSide);

      if (!newLayout) {
        console.warn(`No layout with ${oppositeSide} door, ending path early`);
        break;
      }

      // Platziere Raum
      const { x: newX, y: newY } = calculateNewRoomPosition(
        currentDoor, newLayout, oppositeSide
      );

      if (!canPlaceRoom(dungeon, newLayout, newX, newY, oppositeSide)) {
        // Kann nicht platzieren, nächsten Versuch
        continue;
      }

      const newRoomId = placedRooms.length;
      const newOpenDoors: DoorConnection[] = [];

      placeRoomInDungeon(
        dungeon, roomMap, newLayout, newX, newY, newRoomId,
        placedRooms, newOpenDoors, rooms, oppositeSide
      );

      // Füge zu Pfad hinzu
      path.rooms.push(newRoomId);
      path.length++;

      // Verbinde mit vorigem Raum
      const prevRoomId = path.rooms.length === 1 ? 0 : path.rooms[path.rooms.length - 2];
      rooms[prevRoomId].neighbors.push(newRoomId);
      rooms[newRoomId].neighbors.push(prevRoomId);

      // Entferne benutzte Tür aus openDoors
      const usedDoorIndex = openDoors.findIndex(
        d => d.x === currentDoor.x && d.y === currentDoor.y
      );
      if (usedDoorIndex >= 0) {
        openDoors.splice(usedDoorIndex, 1);
      }

      // Wähle nächste Tür für Pfad (nicht zurück zum vorherigen Raum)
      const availableDoors = newOpenDoors.filter(d => {
        // Filter out door that leads back
        return !(d.side === getOppositeSide(oppositeSide));
      });

      if (availableDoors.length > 0) {
        // Zufällige Richtung wählen (für Kurven)
        currentDoor = availableDoors[
          Math.floor(Math.random() * availableDoors.length)
        ];
      } else {
        // Keine weiteren Türen, Pfad endet hier
        break;
      }
    }

    // Speichere letzte offene Tür für End-Raum-Verbindung
    if (path.rooms.length > 0) {
      const lastRoomId = path.rooms[path.rooms.length - 1];
      const lastRoomDoors = openDoors.filter(d => d.roomId === lastRoomId);
      if (lastRoomDoors.length > 0) {
        path.endDoor = lastRoomDoors[0];
      }
    }

    paths.push(path);
    console.log(
      `[Path ${paths.length}] Generated path with ${path.length} rooms ` +
      `(target: ${targetLength})`
    );
  }

  return paths;
}
```

**Dateien:**
- `lib/dungeon/spawnRoomGeneration.ts` - Neue Datei
- `lib/dungeon/pathGeneration.ts` - Neue Datei für 3-Wege-Logik
- `lib/game/DungeonManager.ts` - Integration der neuen Generierung

**Test-Strategie:**
- Unit-Test: Spawn-Raum wird immer platziert
- Unit-Test: Spawn-Raum hat 3 offene Türen
- E2E-Test: Spieler spawnt in Spawn-Raum
- Visual-Test: 3 Wege sind sichtbar unterschiedlich

**Mögliche Bugs:**
- **Bug:** Spawn-Raum hat nicht 3 Türen nach Platzierung
  - **Fix:** Validierung direkt nach `placeRoomInDungeon()`
- **Bug:** Pfade kollidieren miteinander
  - **Fix:** Strikte Kollisionsprüfung zwischen Pfaden

---

#### **Schritt 6: End-Raum Platzierung & Verbindung**

**Ziel:** Alle 3 Pfade führen zu einem gemeinsamen End-Raum

**Algorithmus:**

```typescript
function placeEndRoom(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[],
  placedRooms: PlacedRoom[],
  paths: Path[],
  pool: LayoutPool
): number {
  // Finde End-Raum-Layouts
  const endLayouts = pool.getLayouts({ roomType: 'end' });

  if (endLayouts.length === 0) {
    console.warn('No end room layouts found, using random layout');
    const allLayouts = pool.getLayouts();
    endLayouts.push(allLayouts[Math.floor(Math.random() * allLayouts.length)]);
  }

  const endLayout = endLayouts[Math.floor(Math.random() * endLayouts.length)];

  // Finde beste Position: Zentrum zwischen den 3 Pfad-Enden
  const pathEnds = paths.map(p => {
    if (p.endDoor) {
      return { x: p.endDoor.x, y: p.endDoor.y };
    } else if (p.rooms.length > 0) {
      const lastRoom = rooms[p.rooms[p.rooms.length - 1]];
      return { x: lastRoom.x + lastRoom.width / 2, y: lastRoom.y + lastRoom.height / 2 };
    }
    return { x: DUNGEON_WIDTH / 2, y: DUNGEON_HEIGHT / 2 };
  });

  // Berechne Zentrum
  const centerX = Math.floor(
    pathEnds.reduce((sum, p) => sum + p.x, 0) / pathEnds.length
  );
  const centerY = Math.floor(
    pathEnds.reduce((sum, p) => sum + p.y, 0) / pathEnds.length
  );

  // Platziere End-Raum nahe dem Zentrum
  let endX = centerX - Math.floor(endLayout.width / 2);
  let endY = centerY - Math.floor(endLayout.height / 2);

  // Prüfe ob Position frei ist
  let attempts = 0;
  while (!canPlaceRoom(dungeon, endLayout, endX, endY) && attempts < 50) {
    // Versuche leicht verschobene Positionen
    endX += (Math.random() - 0.5) * 10;
    endY += (Math.random() - 0.5) * 10;
    attempts++;
  }

  if (attempts >= 50) {
    throw new Error('Could not place end room after 50 attempts');
  }

  const endRoomId = placedRooms.length;
  const endOpenDoors: DoorConnection[] = [];

  placeRoomInDungeon(
    dungeon, roomMap, endLayout, endX, endY, endRoomId,
    placedRooms, endOpenDoors, rooms, undefined
  );

  rooms[endRoomId].type = 'end';

  console.log(`[Dungeon] End room placed at (${endX}, ${endY})`);

  return endRoomId;
}

function connectPathsToEndRoom(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[],
  paths: Path[],
  endRoomId: number
): void {
  const endRoom = rooms[endRoomId];

  for (const path of paths) {
    if (path.rooms.length === 0) continue;

    const lastRoomId = path.rooms[path.rooms.length - 1];
    const lastRoom = rooms[lastRoomId];

    // Finde kürzesten Weg vom letzten Raum zum End-Raum
    const corridor = createCorridor(
      dungeon, roomMap, lastRoom, endRoom, placedRooms.length
    );

    // Füge Korridor-Räume hinzu
    for (const corrRoomId of corridor) {
      rooms[lastRoomId].neighbors.push(corrRoomId);
      rooms[corrRoomId].neighbors.push(lastRoomId);
      lastRoomId = corrRoomId;
    }

    // Verbinde mit End-Raum
    rooms[lastRoomId].neighbors.push(endRoomId);
    rooms[endRoomId].neighbors.push(lastRoomId);

    console.log(
      `[Path Connection] Connected path to end room ` +
      `with ${corridor.length} corridor rooms`
    );
  }
}

function createCorridor(
  dungeon: TileType[][],
  roomMap: number[][],
  fromRoom: Room,
  toRoom: Room,
  startRoomId: number
): number[] {
  // Einfacher Korridor: Gerade Linie von A nach B
  const corridorRooms: number[] = [];

  const fromX = fromRoom.x + Math.floor(fromRoom.width / 2);
  const fromY = fromRoom.y + Math.floor(fromRoom.height / 2);
  const toX = toRoom.x + Math.floor(toRoom.width / 2);
  const toY = toRoom.y + Math.floor(toRoom.height / 2);

  const dx = toX - fromX;
  const dy = toY - fromY;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  let currentRoomId = startRoomId;

  for (let i = 0; i < steps; i += 5) {
    const x = fromX + Math.floor((dx / steps) * i);
    const y = fromY + Math.floor((dy / steps) * i);

    // Prüfe ob Position frei
    if (dungeon[y]?.[x] !== TILE.EMPTY) continue;

    // Platziere 5x5 Korridor-Raum
    for (let cy = 0; cy < 5; cy++) {
      for (let cx = 0; cx < 5; cx++) {
        const tileX = x + cx - 2;
        const tileY = y + cy - 2;

        if (tileX < 0 || tileX >= DUNGEON_WIDTH ||
            tileY < 0 || tileY >= DUNGEON_HEIGHT) continue;

        // Rand = Wand, Innen = Boden
        if (cx === 0 || cx === 4 || cy === 0 || cy === 4) {
          if (dungeon[tileY][tileX] === TILE.EMPTY) {
            dungeon[tileY][tileX] = TILE.WALL;
          }
        } else {
          dungeon[tileY][tileX] = TILE.FLOOR;
          roomMap[tileY][tileX] = currentRoomId;
        }
      }
    }

    corridorRooms.push(currentRoomId);
    currentRoomId++;
  }

  return corridorRooms;
}
```

**Dateien:**
- `lib/dungeon/endRoomPlacement.ts` - Neue Datei
- `lib/dungeon/corridorGeneration.ts` - Neue Datei für Verbindungskorridore

**Test-Strategie:**
- Unit-Test: End-Raum wird platziert
- Unit-Test: Alle 3 Pfade sind mit End-Raum verbunden
- E2E-Test: Laufe von Spawn-Raum zu End-Raum auf allen 3 Wegen
- Playwright: Prüfe dass End-Raum erreichbar ist

**Mögliche Bugs:**
- **Bug:** End-Raum kann nicht platziert werden (keine freie Position)
  - **Fix:** Größere Dungeon-Größe oder flexiblere Platzierung
- **Bug:** Korridor kollidiert mit existierenden Räumen
  - **Fix:** Smarter Pathfinding (A*) statt gerader Linie

---

#### **Schritt 7: Sackgassen & Abzweigungen**

**Ziel:** Automatische Nutzung von Sackgassen-Räumen und zufällige Abzweigungen

**Sackgassen-Erkennung:**
```typescript
function identifyDeadEndLayouts(pool: LayoutPool): RoomLayout[] {
  const allLayouts = pool.getLayouts();

  const deadEnds = allLayouts.filter(layout => {
    const doorCount = [
      layout.doorPositions.north !== null,
      layout.doorPositions.south !== null,
      layout.doorPositions.east !== null,
      layout.doorPositions.west !== null
    ].filter(Boolean).length;

    // Sackgasse = nur 1 Tür
    return doorCount === 1;
  });

  console.log(`[Dungeon] Found ${deadEnds.length} dead-end layouts`);
  return deadEnds;
}
```

**Abzweigungs-Logik:**
```typescript
function maybeAddBranch(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[],
  placedRooms: PlacedRoom[],
  openDoors: DoorConnection[],
  pool: LayoutPool,
  currentRoomId: number
): boolean {
  // 30% Chance für Abzweigung
  if (Math.random() > 0.3) return false;

  // Finde offene Türen des aktuellen Raums
  const roomDoors = openDoors.filter(d => d.roomId === currentRoomId);

  if (roomDoors.length === 0) return false;

  // Wähle zufällige Tür
  const branchDoor = roomDoors[Math.floor(Math.random() * roomDoors.length)];

  // Platziere 1-3 Räume als Abzweigung
  const branchLength = 1 + Math.floor(Math.random() * 3);
  let currentDoor = branchDoor;

  for (let i = 0; i < branchLength; i++) {
    const oppositeSide = getOppositeSide(currentDoor.side);

    // Für letzen Raum: Benutze Sackgasse
    const deadEndLayouts = identifyDeadEndLayouts(pool);
    const useDeadEnd = i === branchLength - 1 && deadEndLayouts.length > 0;

    const newLayout = useDeadEnd
      ? deadEndLayouts[Math.floor(Math.random() * deadEndLayouts.length)]
      : pool.getLayoutWithDoor(oppositeSide);

    if (!newLayout) break;

    const { x: newX, y: newY } = calculateNewRoomPosition(
      currentDoor, newLayout, oppositeSide
    );

    if (!canPlaceRoom(dungeon, newLayout, newX, newY, oppositeSide)) break;

    const newRoomId = placedRooms.length;
    const newOpenDoors: DoorConnection[] = [];

    placeRoomInDungeon(
      dungeon, roomMap, newLayout, newX, newY, newRoomId,
      placedRooms, newOpenDoors, rooms, oppositeSide
    );

    // Verbinde
    rooms[currentDoor.roomId].neighbors.push(newRoomId);
    rooms[newRoomId].neighbors.push(currentDoor.roomId);

    // Entferne benutzte Tür
    const usedIndex = openDoors.findIndex(
      d => d.x === currentDoor.x && d.y === currentDoor.y
    );
    if (usedIndex >= 0) openDoors.splice(usedIndex, 1);

    if (i < branchLength - 1 && newOpenDoors.length > 0) {
      currentDoor = newOpenDoors[0];
    }
  }

  console.log(`[Branch] Added branch with ${branchLength} rooms`);
  return true;
}
```

**Integration in Pfad-Generierung:**
```typescript
// In generateThreePaths():
while (path.rooms.length < targetLength && attempts < maxAttempts) {
  // ... existing room placement ...

  // Nach jedem Raum: Vielleicht Abzweigung hinzufügen
  if (path.rooms.length > 0) {
    const lastRoomId = path.rooms[path.rooms.length - 1];
    maybeAddBranch(
      dungeon, roomMap, rooms, placedRooms, openDoors, pool, lastRoomId
    );
  }

  // ... continue path ...
}
```

**Dateien:**
- `lib/dungeon/branchGeneration.ts` - Neue Datei
- `lib/dungeon/pathGeneration.ts` - Integration

**Test-Strategie:**
- Unit-Test: Sackgassen werden erkannt
- Unit-Test: Abzweigungen werden platziert
- E2E-Test: Manche Dungeons haben Abzweigungen, manche nicht
- Visual-Test: Dungeons sehen unterschiedlich aus (nicht immer gleich)

**Mögliche Bugs:**
- **Bug:** Zu viele Abzweigungen machen Dungeon unübersichtlich
  - **Fix:** Max. 1 Abzweigung pro Hauptraum
- **Bug:** Sackgasse wird mitten im Pfad verwendet
  - **Fix:** Nur am Ende von Abzweigungen verwenden

---

### **Phase 4: Testing & Debugging** (Schritte 8-10)

#### **Schritt 8: Cheat-Menü für schnelles Testen**

**Ziel:** Entwickler-Tools zum schnellen Testen aller Features

**Cheat-Menü Features:**
```typescript
// components/CheatMenu.tsx

interface CheatMenuProps {
  onTeleport: (roomId: number) => void;
  onRevealAll: () => void;
  onRegenerateDungeon: () => void;
  onToggleGodMode: () => void;
  rooms: Room[];
}

export function CheatMenu({
  onTeleport, onRevealAll, onRegenerateDungeon, onToggleGodMode, rooms
}: CheatMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [godMode, setGodMode] = useState(false);

  // Tastatur-Shortcut: Ctrl+Shift+C
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg z-50">
      <h2 className="text-xl font-bold mb-4">🛠️ Cheat Menu</h2>

      <div className="space-y-2">
        {/* Dungeon Controls */}
        <button
          onClick={onRegenerateDungeon}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          🔄 Regenerate Dungeon
        </button>

        <button
          onClick={onRevealAll}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded"
        >
          👁️ Reveal All Rooms
        </button>

        {/* Player Controls */}
        <button
          onClick={() => {
            setGodMode(prev => !prev);
            onToggleGodMode();
          }}
          className={`w-full px-3 py-2 rounded ${
            godMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {godMode ? '⚡ God Mode ON' : '💀 God Mode OFF'}
        </button>

        {/* Teleport */}
        <div className="border-t border-gray-700 pt-2 mt-2">
          <h3 className="text-sm font-semibold mb-2">Teleport to Room:</h3>
          <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
            {rooms.map((room, idx) => (
              <button
                key={idx}
                onClick={() => onTeleport(idx)}
                className={`px-2 py-1 text-xs rounded ${
                  room.type === 'spawn' ? 'bg-green-600 hover:bg-green-700' :
                  room.type === 'end' ? 'bg-red-600 hover:bg-red-700' :
                  room.type === 'shop' ? 'bg-cyan-600 hover:bg-cyan-700' :
                  room.type === 'treasure' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {idx}: {room.type}
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded mt-4"
        >
          ✖ Close
        </button>
      </div>
    </div>
  );
}
```

**Integration in GameCanvas:**
```typescript
// components/GameCanvas.tsx

const [cheatMenuOpen, setCheatMenuOpen] = useState(false);
const [godMode, setGodMode] = useState(false);

const handleTeleport = (roomId: number) => {
  const room = rooms[roomId];
  if (room) {
    setPlayer(prev => ({
      ...prev,
      x: (room.x + room.width / 2) * TILE_SIZE,
      y: (room.y + room.height / 2) * TILE_SIZE
    }));
    console.log(`Teleported to room ${roomId} (${room.type})`);
  }
};

const handleRevealAll = () => {
  setRooms(prev => prev.map(r => ({ ...r, visible: true })));
  console.log('All rooms revealed');
};

const handleRegenerateDungeon = () => {
  // Trigger dungeon regeneration
  dungeonManager.generateFromSpawnRoom(availableSubjects, userId);
  console.log('Dungeon regenerated');
};

const handleToggleGodMode = () => {
  setGodMode(prev => !prev);
  if (!godMode) {
    setPlayer(prev => ({ ...prev, hp: 999, maxHp: 999 }));
  } else {
    setPlayer(prev => ({ ...prev, hp: 100, maxHp: 100 }));
  }
};

// In render:
<CheatMenu
  onTeleport={handleTeleport}
  onRevealAll={handleRevealAll}
  onRegenerateDungeon={handleRegenerateDungeon}
  onToggleGodMode={handleToggleGodMode}
  rooms={rooms}
/>
```

**Dateien:**
- `components/CheatMenu.tsx` - Neue Komponente
- `components/GameCanvas.tsx` - Integration

**Test-Strategie:**
- Manual: Öffne Cheat-Menü mit Ctrl+Shift+C
- Manual: Teleportiere zu allen Raumtypen
- Manual: Reveal all, prüfe dass alle Räume sichtbar sind
- Manual: Regenerate, prüfe dass neuer Dungeon korrekt ist

---

#### **Schritt 9: Playwright E2E-Tests (Ausgiebig)**

**Ziel:** Alle Features mit Playwright headless testen

**Test-Suite:**

```typescript
// tests/e2e/spawn-room-system.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Spawn Room System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Login
    await page.fill('input[name="username"]', 'test-user');
    await page.click('button:has-text("Login")');
    await page.waitForSelector('canvas');
  });

  test('should spawn player in spawn room', async ({ page }) => {
    // Wait for dungeon generation
    await page.waitForTimeout(2000);

    // Check via console logs or game state
    const spawnRoomExists = await page.evaluate(() => {
      // Access game state (assuming it's exposed for testing)
      const rooms = (window as any).gameState?.rooms;
      return rooms && rooms[0]?.type === 'spawn';
    });

    expect(spawnRoomExists).toBe(true);
  });

  test('spawn room has exactly 3 doors', async ({ page }) => {
    await page.waitForTimeout(2000);

    const doorCount = await page.evaluate(() => {
      const rooms = (window as any).gameState?.rooms;
      const spawnRoom = rooms?.[0];
      return spawnRoom?.neighbors?.length || 0;
    });

    expect(doorCount).toBe(3);
  });

  test('can walk through all 3 doors from spawn', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Open cheat menu
    await page.keyboard.press('Control+Shift+C');
    await page.waitForSelector('text=Cheat Menu');

    // Reveal all rooms
    await page.click('button:has-text("Reveal All")');

    // Get spawn room neighbors
    const neighbors = await page.evaluate(() => {
      return (window as any).gameState?.rooms[0]?.neighbors || [];
    });

    expect(neighbors.length).toBe(3);

    // Teleport to each neighbor and verify it's reachable
    for (let i = 0; i < neighbors.length; i++) {
      const neighborId = neighbors[i];

      // Teleport to neighbor
      await page.click(`button:has-text("${neighborId}:")`);
      await page.waitForTimeout(500);

      // Verify player is in room
      const currentRoom = await page.evaluate(() => {
        const player = (window as any).gameState?.player;
        const rooms = (window as any).gameState?.rooms;
        const tileSize = 64;

        const playerTileX = Math.floor(player.x / tileSize);
        const playerTileY = Math.floor(player.y / tileSize);

        return rooms.find((r: any) =>
          playerTileX >= r.x && playerTileX < r.x + r.width &&
          playerTileY >= r.y && playerTileY < r.y + r.height
        );
      });

      expect(currentRoom).toBeDefined();
    }
  });

  test('all 3 paths lead to end room', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Open cheat menu
    await page.keyboard.press('Control+Shift+C');
    await page.click('button:has-text("Reveal All")');

    // Find end room
    const endRoomId = await page.evaluate(() => {
      const rooms = (window as any).gameState?.rooms;
      return rooms?.findIndex((r: any) => r.type === 'end') ?? -1;
    });

    expect(endRoomId).toBeGreaterThan(0);

    // Check that end room has at least 3 neighbors (3 paths converge)
    const endRoomNeighbors = await page.evaluate((id) => {
      const rooms = (window as any).gameState?.rooms;
      return rooms[id]?.neighbors?.length || 0;
    }, endRoomId);

    expect(endRoomNeighbors).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Wall & Door Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="username"]', 'test-user');
    await page.click('button:has-text("Login")');
    await page.waitForSelector('canvas');
  });

  test('no double walls between rooms', async ({ page }) => {
    await page.waitForTimeout(2000);

    const doubleWalls = await page.evaluate(() => {
      const dungeon = (window as any).gameState?.dungeon;
      if (!dungeon) return [];

      const errors: Array<{x: number, y: number}> = [];

      // Scan for horizontal double walls
      for (let y = 0; y < dungeon.length - 1; y++) {
        for (let x = 0; x < dungeon[0].length; x++) {
          if (dungeon[y][x] === 2 && dungeon[y + 1][x] === 2) {
            // Check if floors on both sides
            const hasFloorAbove = y > 0 && dungeon[y - 1][x] === 1;
            const hasFloorBelow = y + 2 < dungeon.length && dungeon[y + 2][x] === 1;

            if (hasFloorAbove && hasFloorBelow) {
              errors.push({ x, y });
            }
          }
        }
      }

      // Scan for vertical double walls
      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[0].length - 1; x++) {
          if (dungeon[y][x] === 2 && dungeon[y][x + 1] === 2) {
            const hasFloorLeft = x > 0 && dungeon[y][x - 1] === 1;
            const hasFloorRight = x + 2 < dungeon[0].length && dungeon[y][x + 2] === 1;

            if (hasFloorLeft && hasFloorRight) {
              errors.push({ x, y });
            }
          }
        }
      }

      return errors;
    });

    if (doubleWalls.length > 0) {
      console.log('Double walls found at:', doubleWalls);
    }

    expect(doubleWalls.length).toBe(0);
  });

  test('all doors have rooms on both sides', async ({ page }) => {
    await page.waitForTimeout(2000);

    const invalidDoors = await page.evaluate(() => {
      const dungeon = (window as any).gameState?.dungeon;
      if (!dungeon) return [];

      const errors: Array<{x: number, y: number, reason: string}> = [];

      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[0].length; x++) {
          if (dungeon[y][x] === 3) { // Door
            const neighbors = {
              top: y > 0 ? dungeon[y - 1][x] : 0,
              bottom: y < dungeon.length - 1 ? dungeon[y + 1][x] : 0,
              left: x > 0 ? dungeon[y][x - 1] : 0,
              right: x < dungeon[0].length - 1 ? dungeon[y][x + 1] : 0
            };

            const floorCount = Object.values(neighbors).filter(n => n === 1).length;

            if (floorCount < 2) {
              errors.push({
                x, y,
                reason: `Only ${floorCount} adjacent floor(s)`
              });
            }

            // Check for blocked doors
            if (neighbors.top === 2 && neighbors.bottom === 2) {
              errors.push({ x, y, reason: 'Blocked vertically' });
            }
            if (neighbors.left === 2 && neighbors.right === 2) {
              errors.push({ x, y, reason: 'Blocked horizontally' });
            }
          }
        }
      }

      return errors;
    });

    if (invalidDoors.length > 0) {
      console.log('Invalid doors found:', invalidDoors);
    }

    expect(invalidDoors.length).toBe(0);
  });

  test('walls have correct orientation', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Take screenshot for visual inspection
    await page.screenshot({
      path: 'test-results/wall-orientation.png',
      fullPage: false
    });

    // Automated check: Count misoriented walls
    const misorientedWalls = await page.evaluate(() => {
      const dungeon = (window as any).gameState?.dungeon;
      if (!dungeon) return 0;

      let count = 0;

      for (let y = 1; y < dungeon.length - 1; y++) {
        for (let x = 1; x < dungeon[0].length - 1; x++) {
          if (dungeon[y][x] === 2) { // Wall
            const hasFloorLeft = dungeon[y][x - 1] === 1;
            const hasFloorRight = dungeon[y][x + 1] === 1;
            const hasFloorTop = dungeon[y - 1][x] === 1;
            const hasFloorBottom = dungeon[y + 1][x] === 1;

            const isHorizontal = hasFloorTop || hasFloorBottom;
            const isVertical = hasFloorLeft || hasFloorRight;

            // Wall should be either horizontal or vertical, not both
            if (isHorizontal && isVertical) {
              count++; // Might be a corner or junction (acceptable)
            }
          }
        }
      }

      return count;
    });

    // This is just a warning, not a failure (corners are valid)
    console.log(`Found ${misorientedWalls} potential corner/junction walls (normal)`);
  });
});

test.describe('Dungeon Generation Stress Test', () => {
  test('generate 10 dungeons, all valid', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="username"]', 'stress-test');
    await page.click('button:has-text("Login")');
    await page.waitForSelector('canvas');

    // Open cheat menu
    await page.keyboard.press('Control+Shift+C');

    for (let i = 0; i < 10; i++) {
      console.log(`Generating dungeon ${i + 1}/10...`);

      // Regenerate
      await page.click('button:has-text("Regenerate")');
      await page.waitForTimeout(2000);

      // Validate
      const validation = await page.evaluate(() => {
        const rooms = (window as any).gameState?.rooms;
        const dungeon = (window as any).gameState?.dungeon;

        const hasSpawnRoom = rooms?.[0]?.type === 'spawn';
        const hasEndRoom = rooms?.some((r: any) => r.type === 'end');
        const spawnDoorCount = rooms?.[0]?.neighbors?.length || 0;

        // Count double walls
        let doubleWallCount = 0;
        for (let y = 0; y < dungeon.length - 1; y++) {
          for (let x = 0; x < dungeon[0].length; x++) {
            if (dungeon[y][x] === 2 && dungeon[y + 1][x] === 2) {
              doubleWallCount++;
            }
          }
        }

        return {
          hasSpawnRoom,
          hasEndRoom,
          spawnDoorCount,
          doubleWallCount,
          roomCount: rooms?.length || 0
        };
      });

      console.log(`Dungeon ${i + 1} validation:`, validation);

      expect(validation.hasSpawnRoom).toBe(true);
      expect(validation.hasEndRoom).toBe(true);
      expect(validation.spawnDoorCount).toBe(3);
      expect(validation.doubleWallCount).toBe(0);
      expect(validation.roomCount).toBeGreaterThan(10);
    }
  });
});
```

**Weitere Tests:**
```typescript
// tests/e2e/sackgassen.spec.ts
test('dead-end rooms are used correctly', async ({ page }) => {
  // ... test that rooms with 1 door end branches ...
});

// tests/e2e/abzweigungen.spec.ts
test('some paths have branches', async ({ page }) => {
  // ... test that branches are added randomly ...
});

// tests/e2e/path-variance.spec.ts
test('paths have different lengths', async ({ page }) => {
  // ... test that 3 paths are not all same length ...
});
```

**Dateien:**
- `tests/e2e/spawn-room-system.spec.ts`
- `tests/e2e/wall-door-validation.spec.ts`
- `tests/e2e/dungeon-stress-test.spec.ts`

**Ausführung:**
```bash
npx playwright test --headed  # Mit Browser (zum Debuggen)
npx playwright test           # Headless (für CI)
```

---

#### **Schritt 10: Fehler beheben & finale Validierung**

**Ziel:** Alle während des Testens gefundenen Fehler beheben

**Fehler-Kategorien:**

**1. Kritische Fehler (Blocker):**
- Dungeon kann nicht generiert werden
- Spieler kann nicht spawnen
- Crash beim Laden

**Vorgehensweise:**
- Sofort debuggen mit Console-Logs
- Stack-Trace analysieren
- Fix implementieren
- Erneut testen

**2. Gameplay-Fehler (Hoch):**
- Tür führt zu Wand
- Doppelte Wände vorhanden
- Spawn-Raum hat nicht 3 Türen
- End-Raum nicht erreichbar

**Vorgehensweise:**
- Unit-Test schreiben der Fehler reproduziert
- Fix implementieren
- Unit-Test läuft durch
- E2E-Test bestätigt Fix

**3. Visuelle Fehler (Mittel):**
- Wände falsch gedreht
- Türen sehen komisch aus
- Rendering-Artefakte

**Vorgehensweise:**
- Screenshot vergleichen
- Rendering-Code prüfen
- Tile-Koordinaten korrigieren
- Visual-Test mit Playwright

**4. Performance-Probleme (Niedrig):**
- Generierung dauert zu lange
- FPS-Drops bei großen Dungeons

**Vorgehensweise:**
- Profiling mit Chrome DevTools
- Algorithmus optimieren
- Caching einbauen

**Debugging-Workflow:**

```typescript
// lib/dungeon/debugUtils.ts

export function logDungeonStats(
  dungeon: TileType[][],
  rooms: Room[],
  roomMap: number[][]
): void {
  console.log('=== DUNGEON STATISTICS ===');
  console.log(`Total rooms: ${rooms.length}`);
  console.log(`Room types:`, {
    spawn: rooms.filter(r => r.type === 'spawn').length,
    end: rooms.filter(r => r.type === 'end').length,
    empty: rooms.filter(r => r.type === 'empty').length,
    treasure: rooms.filter(r => r.type === 'treasure').length,
    combat: rooms.filter(r => r.type === 'combat').length,
    shop: rooms.filter(r => r.type === 'shop').length
  });

  // Count tiles
  let wallCount = 0, floorCount = 0, doorCount = 0, emptyCount = 0;
  for (let y = 0; y < dungeon.length; y++) {
    for (let x = 0; x < dungeon[0].length; x++) {
      switch (dungeon[y][x]) {
        case TILE.WALL: wallCount++; break;
        case TILE.FLOOR: floorCount++; break;
        case TILE.DOOR: doorCount++; break;
        case TILE.EMPTY: emptyCount++; break;
      }
    }
  }

  console.log(`Tiles:`, { wall: wallCount, floor: floorCount, door: doorCount, empty: emptyCount });

  // Validate spawn room
  const spawnRoom = rooms[0];
  if (spawnRoom.type === 'spawn') {
    console.log(`✅ Spawn room: ${spawnRoom.neighbors.length} doors`);
  } else {
    console.error(`❌ First room is not spawn room! Type: ${spawnRoom.type}`);
  }

  // Validate end room
  const endRooms = rooms.filter(r => r.type === 'end');
  if (endRooms.length === 1) {
    console.log(`✅ End room: ${endRooms[0].neighbors.length} connections`);
  } else {
    console.error(`❌ Expected 1 end room, found ${endRooms.length}`);
  }

  // Check for double walls
  const doubleWalls = findDoubleWalls(dungeon);
  if (doubleWalls.length === 0) {
    console.log(`✅ No double walls found`);
  } else {
    console.error(`❌ Found ${doubleWalls.length} double walls:`, doubleWalls.slice(0, 5));
  }

  // Check invalid doors
  const invalidDoors = validateAllDoors(dungeon, rooms);
  if (invalidDoors.length === 0) {
    console.log(`✅ All doors valid`);
  } else {
    console.error(`❌ Found ${invalidDoors.length} invalid doors:`, invalidDoors.slice(0, 5));
  }

  console.log('========================');
}

function findDoubleWalls(dungeon: TileType[][]): Array<{x: number, y: number}> {
  const errors: Array<{x: number, y: number}> = [];

  // Horizontal
  for (let y = 0; y < dungeon.length - 1; y++) {
    for (let x = 0; x < dungeon[0].length; x++) {
      if (dungeon[y][x] === TILE.WALL && dungeon[y + 1][x] === TILE.WALL) {
        const hasFloorAbove = y > 0 && dungeon[y - 1][x] === TILE.FLOOR;
        const hasFloorBelow = y + 2 < dungeon.length && dungeon[y + 2][x] === TILE.FLOOR;
        if (hasFloorAbove && hasFloorBelow) {
          errors.push({ x, y });
        }
      }
    }
  }

  // Vertical
  for (let y = 0; y < dungeon.length; y++) {
    for (let x = 0; x < dungeon[0].length - 1; x++) {
      if (dungeon[y][x] === TILE.WALL && dungeon[y][x + 1] === TILE.WALL) {
        const hasFloorLeft = x > 0 && dungeon[y][x - 1] === TILE.FLOOR;
        const hasFloorRight = x + 2 < dungeon[0].length && dungeon[y][x + 2] === TILE.FLOOR;
        if (hasFloorLeft && hasFloorRight) {
          errors.push({ x, y });
        }
      }
    }
  }

  return errors;
}
```

**Integration:**
```typescript
// In generateDungeonWithSpawnRoom():
const result = { dungeon, rooms, roomMap };

// Debug logging (nur in Development)
if (process.env.NODE_ENV === 'development') {
  logDungeonStats(dungeon, rooms, roomMap);
}

return result;
```

**Finale Checkliste:**
- [ ] Spawn-Raum wird immer als erstes platziert
- [ ] Spawn-Raum hat genau 3 Türen (Nord, Ost, West)
- [ ] 3 separate Pfade gehen vom Spawn-Raum ab
- [ ] End-Raum wird platziert
- [ ] Alle 3 Pfade führen zum End-Raum
- [ ] Pfade haben unterschiedliche Längen (zufällig)
- [ ] Manche Pfade haben Abzweigungen
- [ ] Sackgassen werden automatisch verwendet
- [ ] Keine doppelten Wände zwischen Räumen
- [ ] Alle Türen haben Raum auf beiden Seiten
- [ ] Wände haben korrekte Ausrichtung
- [ ] Spieler spawnt in Spawn-Raum
- [ ] Alle Räume sind vom Spawn-Raum erreichbar
- [ ] Cheat-Menü funktioniert
- [ ] Alle Playwright-Tests bestehen (100%)

---

## 🎯 Erfolgskriterien

1. **Funktional:**
   - Spieler spawnt in Spawn-Raum
   - Kann über alle 3 Wege zum End-Raum laufen
   - Keine Wand-/Tür-Bugs mehr vorhanden

2. **Qualität:**
   - Alle Playwright-Tests bestehen (100%)
   - Keine Console-Errors
   - Dungeon sieht gut aus (visuell korrekt)

3. **Performance:**
   - Generierung < 2 Sekunden
   - 60 FPS beim Spielen

4. **Varianz:**
   - Jeder Dungeon sieht anders aus
   - Pfade haben unterschiedliche Längen
   - Zufällige Abzweigungen

---

## 🐛 Erwartete Bugs & Lösungen

### **Bug-Kategorie 1: Wand-Ausrichtung**

**Bug 1.1:** Horizontale Wände werden vertikal gerendert
- **Ursache:** `detectDoorType()` erkennt Orientierung falsch
- **Lösung:** Alle 4 Nachbarn prüfen, nicht nur 2
- **Test:** Visual-Test mit Screenshot-Vergleich

**Bug 1.2:** Ecken werden als normale Wände gerendert
- **Ursache:** Keine spezielle Behandlung für Ecken
- **Lösung:** `detectWallOrientation()` mit 'corner' Typ
- **Test:** Unit-Test für L-Form-Räume

### **Bug-Kategorie 2: Tür-Probleme**

**Bug 2.1:** Tür führt zu Wand
- **Ursache:** `placeRoomInDungeon()` prüft nicht ob Tür verbindet
- **Lösung:** `validateDoorConnection()` vor Platzierung
- **Test:** E2E-Test läuft durch alle Türen

**Bug 2.2:** Tür wird platziert ohne offenen Raum
- **Ursache:** `openDoors` Array enthält ungültige Türen
- **Lösung:** Post-Validierung nach jedem Raum
- **Test:** Unit-Test mit Mock-Dungeon

### **Bug-Kategorie 3: Spawn-Raum**

**Bug 3.1:** Spawn-Raum hat nicht 3 Türen
- **Ursache:** Layout-Validierung fehlerhaft
- **Lösung:** `validateSpawnRoom()` strikte Prüfung
- **Test:** Unit-Test für alle Spawn-Layouts

**Bug 3.2:** Spawn-Raum wird nicht als erster Raum verwendet
- **Ursache:** Generierungs-Reihenfolge falsch
- **Lösung:** Explizit als `rooms[0]` platzieren
- **Test:** E2E-Test prüft `rooms[0].type === 'spawn'`

### **Bug-Kategorie 4: End-Raum**

**Bug 4.1:** End-Raum kann nicht platziert werden
- **Ursache:** Keine freie Position gefunden
- **Lösung:** Flexiblere Platzierungs-Algorithmus
- **Test:** Stress-Test (100 Dungeons)

**Bug 4.2:** Nicht alle Pfade erreichen End-Raum
- **Ursache:** Korridor-Generierung schlägt fehl
- **Lösung:** A* Pathfinding statt gerader Linie
- **Test:** E2E-Test läuft alle 3 Pfade ab

### **Bug-Kategorie 5: Doppelte Wände**

**Bug 5.1:** `removeDoubleWalls()` übersieht Wände
- **Ursache:** Nur horizontale/vertikale Scans, keine Diagonalen
- **Lösung:** Zusätzlicher Scan für Ecken
- **Test:** Unit-Test mit allen Mustern

---

## 📊 Testing-Strategie

### **Unit-Tests (schnell, isoliert)**
- Wand-Erkennung
- Tür-Validierung
- Spawn-Raum-Validierung
- Sackgassen-Erkennung

### **E2E-Tests mit Playwright (vollständig, realistisch)**
- Spawn-Raum System
- 3-Wege-Generierung
- Tür-Durchgänge
- Wand-Ausrichtung (visuell)
- Stress-Tests (10+ Dungeons)

### **Manuelle Tests (UX, Feeling)**
- Dungeon fühlt sich gut an
- Pfade sind interessant
- Keine Performance-Probleme

---

## 🔧 Datei-Übersicht

**Neu erstellt:**
- `lib/dungeon/spawnRoomGeneration.ts` - Spawn-Raum Logik
- `lib/dungeon/pathGeneration.ts` - 3-Wege Generierung
- `lib/dungeon/endRoomPlacement.ts` - End-Raum Platzierung
- `lib/dungeon/corridorGeneration.ts` - Korridore
- `lib/dungeon/branchGeneration.ts` - Abzweigungen
- `lib/dungeon/doorValidation.ts` - Tür-Validierung
- `lib/dungeon/debugUtils.ts` - Debug-Tools
- `components/CheatMenu.tsx` - Cheat-Menü
- `tests/e2e/spawn-room-system.spec.ts` - E2E-Tests
- `tests/e2e/wall-door-validation.spec.ts` - Validierungs-Tests
- `tests/e2e/dungeon-stress-test.spec.ts` - Stress-Tests

**Geändert:**
- `lib/roomlayouts/types.ts` - Neue Typen 'spawn' & 'end'
- `lib/roomlayouts/validation.ts` - Spawn/End-Validierung
- `lib/db/roomLayouts.ts` - Schema-Update
- `lib/dungeon/layoutGeneration.ts` - Integration neuer Logik
- `lib/rendering/TileRenderer.ts` - Wand-Orientierung Fix
- `lib/tiletheme/WallTypeDetector.ts` - Bessere Erkennung
- `components/roomeditor/LayoutSettings.tsx` - UI für neue Typen
- `lib/data/seed-room-layouts.json` - Neue Seed-Layouts
- `components/GameCanvas.tsx` - Cheat-Menü Integration

---

## ⏱️ Zeitaufwand (Geschätzt)

**Phase 1:** 2-3 Stunden (Analyse & Vorbereitung)
**Phase 2:** 3-4 Stunden (Wand- & Tür-Fixes)
**Phase 3:** 4-5 Stunden (Spawn-Raum & 3-Wege)
**Phase 4:** 3-4 Stunden (Testing & Debugging)

**Gesamt:** ~12-16 Stunden

---

## ✅ Nächste Schritte

1. [ ] Plan vom User bestätigen lassen
2. [ ] Fragen klären falls vorhanden
3. [ ] Mit Schritt 1 (Analyse) beginnen
4. [ ] Nach jedem Schritt: Testen & validieren
5. [ ] Finale Abnahme mit User

---

**Status:** ✅ Plan fertig, warte auf Bestätigung
