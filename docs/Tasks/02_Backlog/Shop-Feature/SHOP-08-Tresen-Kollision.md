# SHOP-08: Tresen-Kollision implementieren

**Feature:** Shop-Räume
**Priorität:** Mittel
**Geschätzte Dauer:** 30-45 Minuten
**Vorgänger:** SHOP-07 (Shop-Layout)
**Nachfolger:** SHOP-10

---

## Ziel

Das Kollisionssystem erweitern, sodass der Spieler nicht durch die Shop-Tresen laufen kann. Tresen verhalten sich wie Wände.

---

## Voraussetzungen

- SHOP-07 (Shop-Layout) muss abgeschlossen sein

---

## Zu bearbeitende Datei

**Pfad:** `lib/physics/CollisionDetector.ts`

---

## Implementierung

### 1. Imports hinzufügen

```typescript
import { getShopLayout, isCounterTile } from '../shop/ShopLayout';
import { Room } from '../constants';
```

### 2. Shop-Kollisionsprüfung erstellen

```typescript
/**
 * Prüft ob eine Position mit einem Shop-Tresen kollidiert.
 * @param worldX - X-Position in Welt-Koordinaten
 * @param worldY - Y-Position in Welt-Koordinaten
 * @param room - Der Shop-Raum
 * @param tileSize - Größe eines Tiles in Pixeln
 * @returns true wenn Kollision mit Tresen
 */
export function checkShopCounterCollision(
  worldX: number,
  worldY: number,
  room: Room,
  tileSize: number
): boolean {
  // Nur für Shop-Räume relevant
  if (room.type !== 'shop') {
    return false;
  }

  // Welt-Koordinaten zu Tile-Koordinaten
  const tileX = Math.floor(worldX / tileSize);
  const tileY = Math.floor(worldY / tileSize);

  // Layout holen und prüfen
  const layout = getShopLayout(room);
  return isCounterTile(tileX, tileY, layout);
}
```

### 3. Bestehende Kollisionsprüfung erweitern

Finde die Hauptfunktion für Kollisionsprüfung (z.B. `checkCollision` oder `checkPlayerCollision`) und erweitere sie:

**Beispiel-Integration:**

```typescript
/**
 * Prüft ob eine Position kollidiert (Wände, Tresen, etc.).
 */
export function checkCollision(
  x: number,
  y: number,
  tileSize: number,
  dungeon: TileType[][],
  entitySizeMultiplier: number,
  currentRoom?: Room  // NEU: Optional für Shop-Kollision
): boolean {
  const halfSize = (tileSize * entitySizeMultiplier) / 2;

  // Alle 4 Ecken der Hitbox prüfen
  const corners = [
    { x: x - halfSize, y: y - halfSize },  // Oben links
    { x: x + halfSize, y: y - halfSize },  // Oben rechts
    { x: x - halfSize, y: y + halfSize },  // Unten links
    { x: x + halfSize, y: y + halfSize }   // Unten rechts
  ];

  for (const corner of corners) {
    const tileX = Math.floor(corner.x / tileSize);
    const tileY = Math.floor(corner.y / tileSize);

    // Grenzen prüfen
    if (tileX < 0 || tileY < 0 ||
        tileY >= dungeon.length ||
        tileX >= dungeon[0].length) {
      return true;  // Außerhalb = Kollision
    }

    // Tile-Typ prüfen (Wand = Kollision)
    const tile = dungeon[tileY][tileX];
    if (tile === TILE.WALL || tile === TILE.EMPTY) {
      return true;
    }

    // NEU: Shop-Tresen-Kollision
    if (currentRoom && currentRoom.type === 'shop') {
      if (checkShopCounterCollision(corner.x, corner.y, currentRoom, tileSize)) {
        return true;
      }
    }
  }

  return false;
}
```

### 4. Room-Parameter durchreichen

Falls die Kollisionsprüfung den aktuellen Raum nicht kennt, muss dieser Parameter durchgereicht werden:

```typescript
// In GameEngine oder useGameState:
function updatePlayerPosition(
  player: Player,
  dx: number,
  dy: number,
  dungeon: TileType[][],
  currentRoom: Room  // Raum in dem der Spieler ist
): Player {
  const newX = player.x + dx;
  const newY = player.y + dy;

  // Kollision prüfen MIT Raum-Info
  if (!checkCollision(newX, newY, TILE_SIZE, dungeon, PLAYER_SIZE, currentRoom)) {
    player.x = newX;
    player.y = newY;
  }

  return player;
}
```

---

## Alternative: Tresen im Dungeon-Array markieren

Falls die Änderung an `checkCollision` zu aufwändig ist, können Tresen-Tiles direkt im Dungeon-Array als Wände markiert werden:

```typescript
// In der Shop-Generierung:
function markCounterTilesAsWalls(
  dungeon: TileType[][],
  room: Room
): void {
  if (room.type !== 'shop') return;

  const layout = getShopLayout(room);
  const allCounterTiles = getAllCounterTiles(layout);

  for (const tile of allCounterTiles) {
    if (tile.y >= 0 && tile.y < dungeon.length &&
        tile.x >= 0 && tile.x < dungeon[0].length) {
      // Spezielle Markierung oder als WALL setzen
      dungeon[tile.y][tile.x] = TILE.WALL;  // Oder neuer TILE.COUNTER
    }
  }
}
```

---

## Testfälle

1. **Spieler läuft gegen Tresen** → Wird gestoppt
2. **Spieler läuft neben Tresen** → Kann normal laufen
3. **Spieler in normalem Raum** → Keine Änderung am Verhalten
4. **Alle 4 Ecken des Tresens** → Kollision funktioniert überall

---

## Debug-Hilfe

Temporär die Tresen-Tiles visualisieren:

```typescript
// Im Renderer:
if (room.type === 'shop') {
  const layout = getShopLayout(room);
  for (const tile of getAllCounterTiles(layout)) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';  // Rot, halbtransparent
    ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}
```

---

## Abnahmekriterien

- [ ] `checkShopCounterCollision()` Funktion erstellt
- [ ] Spieler kann nicht durch Tresen laufen
- [ ] Kollision funktioniert für beide Tresen
- [ ] Keine Auswirkung auf normale Räume
- [ ] Keine TypeScript-Fehler
