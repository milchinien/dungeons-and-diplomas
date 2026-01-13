# SHOP-15: Gegner-Verhalten bei Shops

**Feature:** Shop-Räume
**Priorität:** Mittel
**Geschätzte Dauer:** 1 Stunde
**Vorgänger:** SHOP-06 (Dungeon-Generierung)
**Nachfolger:** SHOP-16

---

## Ziel

Das Gegner-Verhalten anpassen: Keine Gegner in Shop-Räumen spawnen, Gegner können nicht in Shops folgen, Aggro wird an Shop-Türen zurückgesetzt.

---

## Zu bearbeitende Datei

**Pfad:** `lib/Enemy.ts`

---

## Implementierung

### 1. Import und Hilfsfunktion

```typescript
import { Room } from './constants';

/**
 * Prüft ob eine Welt-Position in einem Shop-Raum liegt.
 */
function isPositionInShopRoom(
  worldX: number,
  worldY: number,
  rooms: Room[],
  tileSize: number
): boolean {
  const tileX = Math.floor(worldX / tileSize);
  const tileY = Math.floor(worldY / tileSize);

  for (const room of rooms) {
    if (room.type !== 'shop') continue;

    // Prüfen ob Position im Raum liegt
    if (tileX >= room.x && tileX < room.x + room.width &&
        tileY >= room.y && tileY < room.y + room.height) {
      return true;
    }
  }

  return false;
}

/**
 * Findet den Raum an einer Position.
 */
function getRoomAtPosition(
  worldX: number,
  worldY: number,
  rooms: Room[],
  tileSize: number
): Room | null {
  const tileX = Math.floor(worldX / tileSize);
  const tileY = Math.floor(worldY / tileSize);

  for (const room of rooms) {
    if (tileX >= room.x && tileX < room.x + room.width &&
        tileY >= room.y && tileY < room.y + room.height) {
      return room;
    }
  }

  return null;
}
```

### 2. Bewegung blockieren wenn Ziel ein Shop ist

In der Enemy-Klasse, in der Methode die Bewegung berechnet:

```typescript
class Enemy {
  // ... bestehende Eigenschaften ...

  /**
   * Aktualisiert die Gegner-Position und AI.
   */
  update(
    deltaTime: number,
    player: Player,
    rooms: Room[],
    dungeon: TileType[][],
    tileSize: number
  ): void {
    // ... bestehende State-Logik ...

    if (this.state === 'following' || this.state === 'wandering') {
      const newX = this.x + moveX;
      const newY = this.y + moveY;

      // NEU: Prüfen ob Zielposition in einem Shop liegt
      if (isPositionInShopRoom(newX, newY, rooms, tileSize)) {
        // Bewegung blockieren, Aggro zurücksetzen
        this.resetAggro();
        return;
      }

      // Normale Bewegung
      if (!this.checkCollision(newX, newY, dungeon, tileSize)) {
        this.x = newX;
        this.y = newY;
      }
    }
  }

  /**
   * Setzt den Aggro-Status zurück.
   */
  resetAggro(): void {
    this.state = 'idle';
    this.waypoint = null;
    this.targetPlayer = false;
    this.idleTimer = ENEMY_IDLE_WAIT_TIME;
  }
}
```

### 3. Spieler-Verfolgung stoppen wenn Spieler im Shop

```typescript
/**
 * Prüft ob der Gegner den Spieler verfolgen sollte.
 */
shouldFollowPlayer(
  player: Player,
  rooms: Room[],
  tileSize: number
): boolean {
  // Distanz prüfen
  const distance = this.getDistanceToPlayer(player);
  if (distance > ENEMY_AGGRO_RADIUS * tileSize) {
    return false;  // Zu weit weg
  }

  // NEU: Prüfen ob Spieler in einem Shop ist
  const playerRoom = getRoomAtPosition(player.x, player.y, rooms, tileSize);
  if (playerRoom && playerRoom.type === 'shop') {
    return false;  // Spieler ist sicher im Shop
  }

  return true;
}

/**
 * Aktualisiert den AI-State.
 */
updateAIState(
  player: Player,
  rooms: Room[],
  tileSize: number
): void {
  const shouldFollow = this.shouldFollowPlayer(player, rooms, tileSize);

  if (shouldFollow && this.state !== 'following') {
    // Aggro starten
    this.state = 'following';
  } else if (!shouldFollow && this.state === 'following') {
    // Aggro verlieren (Spieler im Shop oder zu weit weg)
    this.resetAggro();
  }
}
```

### 4. Gegner-Spawning anpassen

In der Dungeon-Generierung oder Enemy-Spawning-Logik:

```typescript
/**
 * Spawnt Gegner in einem Raum.
 * Gibt leeres Array zurück für Shop-Räume.
 */
function spawnEnemiesInRoom(room: Room): Enemy[] {
  // KEINE Gegner in Shop-Räumen!
  if (room.type === 'shop') {
    return [];
  }

  // Bestehende Spawn-Logik...
  const enemies: Enemy[] = [];

  // ... Gegner erstellen ...

  return enemies;
}
```

---

## Alternative: Zentrale Shop-Check-Funktion

Falls die Änderungen in Enemy.ts zu umfangreich werden, eine zentrale Hilfsdatei erstellen:

**Pfad:** `lib/shop/ShopZone.ts`

```typescript
import { Room, Player } from '../constants';
import { Enemy } from '../Enemy';

/**
 * Prüft ob ein Punkt in einer Shop-Zone liegt.
 */
export function isInShopZone(
  x: number,
  y: number,
  rooms: Room[],
  tileSize: number
): boolean {
  // ... Implementierung ...
}

/**
 * Aktualisiert alle Gegner und setzt Aggro zurück wenn nötig.
 */
export function updateEnemiesForShopZones(
  enemies: Enemy[],
  player: Player,
  rooms: Room[],
  tileSize: number
): void {
  const playerInShop = isInShopZone(player.x, player.y, rooms, tileSize);

  for (const enemy of enemies) {
    if (playerInShop && enemy.state === 'following') {
      enemy.resetAggro();
    }
  }
}
```

---

## Testfälle

1. **Dungeon generieren** → Keine Gegner in Shop-Räumen
2. **Spieler betritt Shop** → Verfolgende Gegner bleiben draußen
3. **Gegner nahe Shop-Tür** → Kann nicht reinlaufen
4. **Spieler verlässt Shop** → Gegner können wieder aggroen
5. **Aggro-Reset** → Gegner gehen in IDLE

---

## Abnahmekriterien

- [ ] Keine Gegner spawnen in Shop-Räumen
- [ ] Gegner können nicht in Shops hineinlaufen
- [ ] Aggro wird zurückgesetzt wenn Spieler Shop betritt
- [ ] Gegner bleiben an Shop-Tür stehen
- [ ] Gegner gehen nach Aggro-Reset in IDLE
- [ ] Keine TypeScript-Fehler
