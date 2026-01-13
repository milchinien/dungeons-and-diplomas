# SHOP-07: Shop-Layout berechnen

**Feature:** Shop-Räume
**Priorität:** Mittel
**Geschätzte Dauer:** 1 Stunde
**Vorgänger:** SHOP-05
**Nachfolger:** SHOP-08, SHOP-10

---

## Ziel

Ein System erstellen, das die Positionen von Schild, Tresen und schwebenden Waren innerhalb eines Shop-Raums berechnet. Das Layout passt sich der Raumgröße an.

---

## Zu erstellende Datei

**Pfad:** `lib/shop/ShopLayout.ts`

---

## Visualisierung des Shop-Layouts

```
+------------------+
|                  |
|    [SCHILD]      |   <- Oberes Drittel, zentriert
|                  |
| +----+    +----+ |
| |    |    |    | |   <- Tresen (links: Items, rechts: Perks)
| +----+    +----+ |
|  I I I    P P P  |   <- Schwebende Waren über Tresen
|                  |
+------------------+

I = Item-Position
P = Perk-Position
```

---

## Implementierung

### 1. Interface für Shop-Layout

```typescript
export interface Position {
  x: number;
  y: number;
}

export interface ShopLayout {
  /** Position des Shop-Schildes (Tile-Koordinaten) */
  signPosition: Position;

  /** Tiles des linken Tresens (Item-Tresen) */
  leftCounterTiles: Position[];

  /** Tiles des rechten Tresens (Perk-Tresen) */
  rightCounterTiles: Position[];

  /** Positionen der 3 Items (Welt-Koordinaten, nicht Tiles) */
  itemPositions: Position[];

  /** Positionen der 3 Perks (Welt-Koordinaten, nicht Tiles) */
  perkPositions: Position[];
}
```

### 2. Layout-Berechnung

```typescript
import { Room, TILE_SIZE } from '../constants';

/**
 * Berechnet das Layout eines Shop-Raums basierend auf dessen Größe.
 * Alle Positionen sind relativ zum Raum-Ursprung.
 */
export function calculateShopLayout(room: Room): ShopLayout {
  const roomCenterX = room.x + Math.floor(room.width / 2);
  const roomCenterY = room.y + Math.floor(room.height / 2);

  // Schild: Oberes Drittel, zentriert
  const signPosition: Position = {
    x: roomCenterX,
    y: room.y + 1  // 1 Tile vom oberen Rand
  };

  // Tresen-Positionen (2 Tiles breit, 1 Tile hoch)
  const counterY = roomCenterY + 1;  // Leicht unter der Mitte
  const counterWidth = 2;
  const gap = 2;  // Abstand zwischen den Tresen

  // Linker Tresen (für Items)
  const leftCounterStartX = roomCenterX - gap / 2 - counterWidth;
  const leftCounterTiles: Position[] = [];
  for (let i = 0; i < counterWidth; i++) {
    leftCounterTiles.push({
      x: leftCounterStartX + i,
      y: counterY
    });
  }

  // Rechter Tresen (für Perks)
  const rightCounterStartX = roomCenterX + Math.ceil(gap / 2);
  const rightCounterTiles: Position[] = [];
  for (let i = 0; i < counterWidth; i++) {
    rightCounterTiles.push({
      x: rightCounterStartX + i,
      y: counterY
    });
  }

  // Item-Positionen (3 Items über dem linken Tresen)
  const itemPositions: Position[] = [];
  const itemY = counterY - 1;  // Über dem Tresen
  for (let i = 0; i < 3; i++) {
    itemPositions.push({
      x: (leftCounterStartX + i * 0.7) * TILE_SIZE + TILE_SIZE / 2,
      y: itemY * TILE_SIZE
    });
  }

  // Perk-Positionen (3 Perks über dem rechten Tresen)
  const perkPositions: Position[] = [];
  for (let i = 0; i < 3; i++) {
    perkPositions.push({
      x: (rightCounterStartX + i * 0.7) * TILE_SIZE + TILE_SIZE / 2,
      y: itemY * TILE_SIZE
    });
  }

  return {
    signPosition,
    leftCounterTiles,
    rightCounterTiles,
    itemPositions,
    perkPositions
  };
}
```

### 3. Hilfsfunktionen

```typescript
/**
 * Prüft ob eine Tile-Position auf einem Tresen liegt.
 */
export function isCounterTile(
  tileX: number,
  tileY: number,
  layout: ShopLayout
): boolean {
  const isLeftCounter = layout.leftCounterTiles.some(
    tile => tile.x === tileX && tile.y === tileY
  );
  const isRightCounter = layout.rightCounterTiles.some(
    tile => tile.x === tileX && tile.y === tileY
  );
  return isLeftCounter || isRightCounter;
}

/**
 * Gibt alle Tresen-Tiles zurück.
 */
export function getAllCounterTiles(layout: ShopLayout): Position[] {
  return [...layout.leftCounterTiles, ...layout.rightCounterTiles];
}

/**
 * Berechnet die Schwebhöhe für eine Animation.
 * @param time - Aktuelle Zeit in Sekunden
 * @param baseY - Basis-Y-Position
 * @param amplitude - Schweb-Amplitude in Pixeln
 * @param speed - Zyklen pro Sekunde
 */
export function calculateFloatingY(
  time: number,
  baseY: number,
  amplitude: number,
  speed: number
): number {
  return baseY + Math.sin(time * speed * Math.PI * 2) * amplitude;
}
```

### 4. Layout-Cache (optional, für Performance)

```typescript
// Cache für berechnete Layouts
const layoutCache = new Map<number, ShopLayout>();

/**
 * Gibt das Layout für einen Raum zurück (mit Caching).
 */
export function getShopLayout(room: Room): ShopLayout {
  if (layoutCache.has(room.id)) {
    return layoutCache.get(room.id)!;
  }

  const layout = calculateShopLayout(room);
  layoutCache.set(room.id, layout);
  return layout;
}

/**
 * Löscht den Layout-Cache (bei neuem Dungeon).
 */
export function clearLayoutCache(): void {
  layoutCache.clear();
}
```

---

## Beispiel-Ausgabe

Für einen Raum bei Position (10, 10) mit Größe 8x8:

```typescript
const layout = calculateShopLayout(room);

// signPosition: { x: 14, y: 11 }
// leftCounterTiles: [{ x: 12, y: 15 }, { x: 13, y: 15 }]
// rightCounterTiles: [{ x: 15, y: 15 }, { x: 16, y: 15 }]
// itemPositions: [{ x: 800, y: 896 }, { x: 845, y: 896 }, { x: 890, y: 896 }]
// perkPositions: [{ x: 992, y: 896 }, { x: 1037, y: 896 }, { x: 1082, y: 896 }]
```

---

## Testfälle

1. **Raum 8x8** → Layout passt
2. **Raum 6x6** (Minimum) → Layout passt
3. **Raum 12x12** (groß) → Layout skaliert
4. **isCounterTile()** → Erkennt Tresen korrekt
5. **calculateFloatingY()** → Oszilliert korrekt

---

## Abnahmekriterien

- [ ] Datei `lib/shop/ShopLayout.ts` existiert
- [ ] `ShopLayout` Interface definiert
- [ ] `calculateShopLayout()` berechnet korrektes Layout
- [ ] `isCounterTile()` funktioniert
- [ ] `calculateFloatingY()` funktioniert
- [ ] Layout passt sich Raumgröße an
- [ ] Keine TypeScript-Fehler
