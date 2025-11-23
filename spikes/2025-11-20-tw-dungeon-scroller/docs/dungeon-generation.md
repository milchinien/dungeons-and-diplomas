# Dungeon Decoration System

## Übersicht

Dieses Dokument beschreibt den Ansatz zur prozeduralen Dekoration von generierten Dungeon-Räumen mit Assets unterschiedlicher Größe, während die Begehbarkeit (Walkability) garantiert bleibt.

## Problem

- **Multi-Tile Assets**: Einige Dekorationselemente sind größer als 1×1 Tiles
- **Prefab Arrangements**: Vordefinierte Arrangements (z.B. 5×4 Tiles) sollen platziert werden
- **Walkability**: Dungeon muss vollständig begehbar bleiben
- **Türen**: Türen dürfen nicht blockiert werden
- **Erreichbarkeit**: Alle Bereiche müssen erreichbar bleiben

## Klassische Ansätze

### 1. Prefab/Template-basierte Dekoration
Vordefinierte Raum-Layouts mit festgelegten Deko-Positionen. Gut für handcrafted feel, weniger prozedural.

**Beispiele**: "Alchemie-Labor", "Bibliothek", "Gefängnis"

### 2. Rule-Based Placement
Regeln definieren Platzierungsbedingungen für Objekte.

**Beispiele**:
- "Fackeln an Wänden"
- "Tische nicht vor Türen"
- "Säulen symmetrisch"

### 3. Wave Function Collapse (WFC)
Sehr mächtiger Algorithmus für tile-basierte Generierung. Basiert auf Constraints zwischen benachbarten Tiles.

**Vorteil**: Kann komplexe, kohärente Muster erzeugen
**Nachteil**: Komplex zu implementieren

### 4. Flood-Fill Validation
Nach jeder Platzierung wird geprüft, ob alle Bereiche noch erreichbar sind.

**Status**: ✅ Essentiell für Walkability-Garantie

### 5. Zone-basierte Platzierung
Räume werden in Zonen eingeteilt: "protected", "decorable", "high-traffic"

**Regel**: Nur in decorable zones platzieren

## Empfohlener Hybrid-Ansatz

### Algorithmus-Pipeline

```
1. Protected Zones berechnen (Türen, Pfade zwischen Türen)
2. Decorable Areas identifizieren
3. Large Prefabs platzieren (5×4 Arrangements)
4. Medium Decorations platzieren (2×2, 3×2 Assets)
5. Small Decorations platzieren (1×1 Assets)
6. Nach jedem Schritt: Walkability validieren
```

### Kernkonzepte

#### 1. Walkability Grid
Paralleles Array zum `dungeon[][]` array:

```typescript
walkabilityMap: boolean[][]  // true = walkable
```

#### 2. Protected Zones
Tiles, die NIEMALS blockiert werden dürfen:

```typescript
protectedTiles: Set<string>  // Format: "x,y"
```

#### 3. Decoration Templates
Vordefinierte Arrangements von Tiles:

```typescript
interface DecorationTemplate {
  id: string;
  width: number;
  height: number;
  tiles: DecorationTile[];
  requiredSpace: {width: number, height: number};
  minDistanceFromDoor: number;
  allowRotation: boolean;
}

interface DecorationTile {
  offsetX: number;      // Relative Position im Template
  offsetY: number;
  spriteX: number;      // Sprite-Koordinate im Tileset
  spriteY: number;
  walkable: boolean;
  layer: 'floor' | 'object' | 'wall-decoration';
}
```

## Implementierungs-Details

### Phase 1: Protected Zones berechnen

```typescript
function calculateProtectedZones(room: Room, doors: Door[]): Set<string> {
  const protected = new Set<string>();

  // 1. Alle Tür-Tiles + Radius um Türen
  for (const door of doors) {
    protected.add(`${door.x},${door.y}`);
    addRadiusToProtected(protected, door.x, door.y, 1);
  }

  // 2. Pfade zwischen Türen
  if (doors.length >= 2) {
    for (let i = 0; i < doors.length; i++) {
      for (let j = i + 1; j < doors.length; j++) {
        const path = findPath(doors[i], doors[j], room);
        path.forEach(tile => protected.add(`${tile.x},${tile.y}`));
      }
    }
  }

  // 3. Optional: 1-tile breiter Pfad entlang der Wände

  return protected;
}
```

**Was wird geschützt:**
- ✅ Tür-Tiles + 1 Tile Radius
- ✅ Pfade zwischen allen Türen (A* oder line-of-sight)
- ✅ Optional: Wandpfade für Erreichbarkeit

### Phase 2: Placement-Algorithmus

```typescript
function decorateRoom(
  room: Room,
  protectedZones: Set<string>,
  decorationTemplates: DecorationTemplate[]
): PlacedDecoration[] {

  const placements: PlacedDecoration[] = [];
  const occupiedTiles = new Set<string>(protectedZones);

  // Sortiere Templates: Große zuerst
  const sortedTemplates = [...decorationTemplates]
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));

  for (const template of sortedTemplates) {
    const maxAttempts = 20;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const pos = getRandomPositionInRoom(room);

      // Validierungsschritte:
      if (!fitsInRoom(template, pos, room)) {
        attempts++;
        continue;
      }

      if (collidesWithOccupied(template, pos, occupiedTiles)) {
        attempts++;
        continue;
      }

      if (tooCloseToProtectedZone(template, pos, protectedZones)) {
        attempts++;
        continue;
      }

      // KRITISCH: Walkability validieren
      const tempOccupied = new Set(occupiedTiles);
      markTemplateAsOccupied(template, pos, tempOccupied);

      if (!isRoomStillWalkable(room, tempOccupied, protectedZones)) {
        attempts++;
        continue;
      }

      // Platzierung erfolgreich!
      placements.push({ template, x: pos.x, y: pos.y });
      markTemplateAsOccupied(template, pos, occupiedTiles);
      break;
    }
  }

  return placements;
}
```

**Validierungsschritte:**
1. ✅ Passt Template in Raum?
2. ✅ Kollidiert mit bereits platzierten Objekten?
3. ✅ Zu nah an Protected Zone?
4. ✅ Bleibt Raum walkable? (Flood-Fill)

### Phase 3: Walkability Validation (KRITISCH!)

```typescript
function isRoomStillWalkable(
  room: Room,
  occupiedTiles: Set<string>,
  protectedZones: Set<string>
): boolean {
  // Flood-Fill von jedem Door-Tile aus
  const doors = getDoorsForRoom(room);
  if (doors.length === 0) return true;

  const reachable = new Set<string>();
  const queue: {x: number, y: number}[] = [{x: doors[0].x, y: doors[0].y}];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (reachable.has(key)) continue;
    if (occupiedTiles.has(key)) continue;  // Blockiert
    if (!isInRoom(current, room)) continue;

    reachable.add(key);

    // 4-directional neighbors
    queue.push(
      {x: current.x + 1, y: current.y},
      {x: current.x - 1, y: current.y},
      {x: current.x, y: current.y + 1},
      {x: current.x, y: current.y - 1}
    );
  }

  // Alle Türen erreichbar?
  for (const door of doors) {
    if (!reachable.has(`${door.x},${door.y}`)) {
      return false;
    }
  }

  // Alle protected zones erreichbar?
  for (const protectedKey of protectedZones) {
    if (!reachable.has(protectedKey)) {
      return false;
    }
  }

  return true;
}
```

**Flood-Fill Garantien:**
- ✅ Alle Türen sind erreichbar
- ✅ Alle protected zones sind erreichbar
- ✅ Keine isolierten Bereiche

## Datenstrukturen

### DecorationTemplate (erweitert)

```typescript
interface DecorationTemplate {
  id: string;
  name: string;  // Für Debugging
  width: number;
  height: number;
  tiles: DecorationTile[];

  // Placement constraints
  minRoomWidth: number;
  minRoomHeight: number;
  minDistanceFromDoor: number;
  minDistanceFromWall: number;
  maxInstancesPerRoom: number;

  // Room type filters
  allowedRoomTypes: ('empty' | 'treasure' | 'combat')[];

  // Placement hints
  preferWallAdjacent: boolean;
  preferCentered: boolean;
  allowRotation: boolean;
}
```

### PlacedDecoration

```typescript
interface PlacedDecoration {
  template: DecorationTemplate;
  x: number;  // Top-left anchor point
  y: number;
  rotation: 0 | 90 | 180 | 270;
}
```

### Room (erweitert)

```typescript
interface Room {
  // ... existing fields
  decorations: PlacedDecoration[];
  protectedTiles: Set<string>;
}
```

## Template-Bibliothek

### Beispiel: Großer Tisch (3×2)

```typescript
{
  id: 'table_large',
  name: 'Large Table',
  width: 3,
  height: 2,
  tiles: [
    {offsetX: 0, offsetY: 0, spriteX: 10, spriteY: 5, walkable: false, layer: 'object'},
    {offsetX: 1, offsetY: 0, spriteX: 11, spriteY: 5, walkable: false, layer: 'object'},
    {offsetX: 2, offsetY: 0, spriteX: 12, spriteY: 5, walkable: false, layer: 'object'},
    {offsetX: 0, offsetY: 1, spriteX: 10, spriteY: 6, walkable: false, layer: 'object'},
    {offsetX: 1, offsetY: 1, spriteX: 11, spriteY: 6, walkable: false, layer: 'object'},
    {offsetX: 2, offsetY: 1, spriteX: 12, spriteY: 6, walkable: false, layer: 'object'},
  ],
  minRoomWidth: 5,
  minRoomHeight: 4,
  minDistanceFromDoor: 2,
  minDistanceFromWall: 1,
  maxInstancesPerRoom: 1,
  allowedRoomTypes: ['empty', 'combat'],
  preferWallAdjacent: false,
  preferCentered: true,
  allowRotation: true
}
```

### Beispiel: Fackel an Wand (1×1)

```typescript
{
  id: 'torch_wall',
  name: 'Wall Torch',
  width: 1,
  height: 1,
  tiles: [
    {offsetX: 0, offsetY: 0, spriteX: 8, spriteY: 3, walkable: true, layer: 'wall-decoration'}
  ],
  minRoomWidth: 3,
  minRoomHeight: 3,
  minDistanceFromDoor: 1,
  minDistanceFromWall: 0,  // Muss an Wand sein!
  maxInstancesPerRoom: 4,
  allowedRoomTypes: ['empty', 'treasure', 'combat'],
  preferWallAdjacent: true,
  preferCentered: false,
  allowRotation: false
}
```

### Beispiel: Großes Arrangement (5×4)

```typescript
{
  id: 'alchemy_station',
  name: 'Alchemy Station',
  width: 5,
  height: 4,
  tiles: [
    // ... 20 Tiles definieren
    // Kombination aus Tischen, Regalen, Tränken, etc.
  ],
  minRoomWidth: 7,
  minRoomHeight: 6,
  minDistanceFromDoor: 2,
  minDistanceFromWall: 1,
  maxInstancesPerRoom: 1,
  allowedRoomTypes: ['empty'],
  preferWallAdjacent: false,
  preferCentered: true,
  allowRotation: false
}
```

## Integration in generation.ts

### Neue Datei: lib/dungeon/decoration.ts

```typescript
export function decorateDungeon(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[]
) {
  for (const room of rooms) {
    // 1. Finde Türen für diesen Raum
    const doors = findDoorsForRoom(room, dungeon, roomMap);

    // 2. Berechne Protected Zones
    room.protectedTiles = calculateProtectedZones(room, doors, roomMap);

    // 3. Filtere passende Templates
    const eligibleTemplates = DECORATION_TEMPLATES.filter(t =>
      t.allowedRoomTypes.includes(room.type) &&
      t.minRoomWidth <= room.width &&
      t.minRoomHeight <= room.height
    );

    // 4. Platziere Dekorationen
    room.decorations = placeDecorationsInRoom(
      room,
      eligibleTemplates,
      dungeon,
      roomMap
    );
  }
}
```

### Aufruf in generateNewDungeon

```typescript
// In DungeonManager.ts
this.rooms = generateRooms(this.dungeon, this.roomMap);
connectRooms(this.dungeon, this.roomMap, this.rooms);
calculateSpatialNeighbors(this.dungeon, this.roomMap, this.rooms);
decorateDungeon(this.dungeon, this.roomMap, this.rooms);  // NEU
addWalls(this.dungeon);
```

## Zusätzliche Features

### Interior Walls (Zwischenwände)

Für größere Räume können interne Wände eingezogen werden, um interessantere Layouts zu erzeugen.

```typescript
function addInteriorWalls(room: Room, occupiedTiles: Set<string>) {
  // Nur in größeren Räumen
  if (room.width < 8 || room.height < 8) return;

  // 50% horizontal, 50% vertikal
  const horizontal = Math.random() < 0.5;

  if (horizontal) {
    const wallY = room.y + Math.floor(room.height / 2);
    // Lasse Lücke für Durchgang (2 Tiles)
    const gapStart = room.x + Math.floor(Math.random() * (room.width - 2));

    for (let x = room.x; x < room.x + room.width; x++) {
      if (x >= gapStart && x < gapStart + 2) continue;  // Durchgang
      if (occupiedTiles.has(`${x},${wallY}`)) continue;

      dungeon[wallY][x] = TILE.WALL;
      occupiedTiles.add(`${x},${wallY}`);
    }
  }

  // WICHTIG: Walkability validieren!
}
```

**Wann verwenden:**
- Raum breite ≥ 8 tiles
- Raum höhe ≥ 8 tiles
- Durchgang: mindestens 2 tiles breit
- Nach Platzierung: Walkability validieren

### Raum-spezifische Dekoration

Templates können nach Raumtyp gefiltert werden:

```typescript
function selectTemplatesForRoomType(room: Room): DecorationTemplate[] {
  switch (room.type) {
    case 'treasure':
      return [
        TEMPLATES.chest_large,
        TEMPLATES.pedestal,
        TEMPLATES.gold_pile,
        TEMPLATES.torch_wall
      ];

    case 'combat':
      return [
        TEMPLATES.weapon_rack,
        TEMPLATES.training_dummy,
        TEMPLATES.blood_stain,
        TEMPLATES.cage
      ];

    case 'empty':
    default:
      return [
        TEMPLATES.table_large,
        TEMPLATES.bookshelf,
        TEMPLATES.barrel_cluster,
        TEMPLATES.torch_wall
      ];
  }
}
```

## Rendering

### Layer-basiertes Rendering

Dekorationen haben unterschiedliche Layer für korrektes Z-Ordering:

```typescript
// In GameRenderer.ts
function renderRoomDecorations(room: Room, ctx: CanvasRenderingContext2D) {
  // Layer 1: Floor decorations (unter Player)
  for (const placement of room.decorations) {
    for (const tile of placement.template.tiles) {
      if (tile.layer !== 'floor') continue;

      const worldX = (placement.x + tile.offsetX) * TILE_SIZE;
      const worldY = (placement.y + tile.offsetY) * TILE_SIZE;

      ctx.drawImage(
        tileset,
        tile.spriteX * TILE_SIZE,
        tile.spriteY * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
        worldX,
        worldY,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  // Player wird hier gerendert

  // Layer 2: Object decorations (gleiche Höhe wie Player)
  // Layer 3: Wall decorations (über Player)
}
```

**Rendering-Reihenfolge:**
1. Floor tiles
2. Floor decorations (`layer: 'floor'`)
3. Object decorations (`layer: 'object'`) + Player (Y-sorted)
4. Wall decorations (`layer: 'wall-decoration'`)

## Implementierungs-Roadmap

### Phase 1: Protected Zones System
**Ziel**: Türen und kritische Pfade schützen

- [ ] `calculateProtectedZones()` implementieren
- [ ] Tür-Erkennung für Räume
- [ ] Einfache Pfadvalidierung zwischen Türen
- [ ] Visualisierung für Debugging

### Phase 2: Einfache 1×1 Dekorationen
**Ziel**: Placement-Algorithmus lernen

- [ ] Template-Datenstruktur erstellen
- [ ] 3-5 simple Templates definieren (Fackeln, Vasen, Props)
- [ ] Basic placement ohne Walkability-Check
- [ ] Rendering integrieren

### Phase 3: Multi-Tile Assets (2×2, 3×2)
**Ziel**: Walkability-Validierung perfektionieren

- [ ] Flood-Fill Validation implementieren
- [ ] `isRoomStillWalkable()` Funktion
- [ ] Templates für Tische, Truhen, Regale
- [ ] Collision-Detection für occupied tiles

### Phase 4: Große Arrangements (5×4+)
**Ziel**: Komplexe vordefinierte Szenen

- [ ] Template-System erweitern (rotation support)
- [ ] 2-3 große Arrangements definieren
- [ ] Room-type spezifische Template-Selection
- [ ] Placement-Hints (preferCentered, preferWallAdjacent)

### Phase 5: Interior Walls
**Ziel**: Raumteilung für große Räume

- [ ] `addInteriorWalls()` Funktion
- [ ] Mindestgröße-Check
- [ ] Durchgangs-Generierung
- [ ] Walkability mit Wänden validieren

## Kritische Success-Faktoren

### ✅ Must-Have
1. **Flood-Fill Validation** nach JEDEM Placement
2. **Protected Zones** um Türen (mindestens 1 Tile Radius)
3. **Placement-Order**: Groß → Klein (große Templates zuerst)
4. **Attempt Limit**: Genug Versuche pro Template (20+), aber Limit setzen
5. **Collision-Detection**: Exakte Prüfung auf occupied tiles

### ⚠️ Wichtige Details
- **Türen nie blockieren**: minDistanceFromDoor beachten
- **Pfade freihalten**: Zwischen allen Türen muss Pfad existieren
- **Raum nicht überfüllen**: maxInstancesPerRoom respektieren
- **Performance**: Bei vielen Templates → frühzeitig abbrechen wenn unmöglich

### 🎯 Nice-to-Have
- Template-Rotation für mehr Varianz
- Symmetrische Platzierung (z.B. Säulen)
- Thematische Raum-Sets (Labor, Bibliothek, etc.)
- Adaptive Dichte (große Räume = mehr Deko)

## Performance-Überlegungen

### Optimierungen

**1. Template Pre-Filtering**
```typescript
// Filtere unpassende Templates früh aus
const eligible = templates.filter(t =>
  t.minRoomWidth <= room.width &&
  t.minRoomHeight <= room.height &&
  t.allowedRoomTypes.includes(room.type)
);
```

**2. Spatial Hashing**
```typescript
// Für große Dungeons: Spatial Grid für occupied tiles
class SpatialGrid {
  // O(1) lookup statt O(n) Set-Iteration
}
```

**3. Early Exit**
```typescript
// Bei unmöglichen Räumen früh abbrechen
if (room.width * room.height < MIN_DECORATABLE_AREA) {
  return [];
}
```

### Profiling-Punkte
- Flood-Fill Validierung (teuerste Operation)
- Template-Collision Checks
- Protected Zone Berechnung

## Testing & Debugging

### Visualisierung

```typescript
// Debug-Rendering für Protected Zones
function debugRenderProtectedZones(ctx: CanvasRenderingContext2D) {
  for (const room of rooms) {
    for (const key of room.protectedTiles) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}
```

### Test-Cases

1. **Minimaler Raum** (4×4): Sollte nur wenige 1×1 Dekorationen bekommen
2. **Raum mit vielen Türen**: Protected Zones überlappen
3. **Langer schmaler Raum** (10×3): Große Templates passen nicht
4. **Großer Raum** (15×15): Mehrere große Arrangements möglich
5. **L-förmiger Raum**: Walkability-Checks besonders wichtig

## Referenzen & Inspiration

### Algorithmen
- **Rogue**: Ursprünglicher Dungeon-Generator
- **Brogue**: Exzellente prozedurale Dekoration
- **Spelunky**: Template-basierte Level-Generation
- **Dungeon Keeper**: Raum-Theming und Funktionalität

### Papers & Resources
- "Procedural Content Generation in Games" (Shaker et al.)
- "Wave Function Collapse" Algorithm
- "Answer Set Programming for Procedural Content Generation"

### Ähnliche Projekte
- rot.js (Roguelike Toolkit für JavaScript)
- Godot PCG Plugins
- Unity Dungeon Generator Assets

---

**Erstellt**: 2025-11-21
**Autor**: Dungeons & Diplomas Team
**Status**: Planning Document
