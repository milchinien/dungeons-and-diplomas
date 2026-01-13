# SHOP-09: Shop-Tür-Mechanik implementieren

**Feature:** Shop-Räume
**Priorität:** Mittel
**Geschätzte Dauer:** 1-2 Stunden
**Vorgänger:** SHOP-06
**Nachfolger:** SHOP-12, SHOP-14

---

## Ziel

Eine Mechanik implementieren, bei der Shop-Türen zunächst verschlossen sind und sich erst öffnen, wenn alle Gegner im Nachbarraum besiegt wurden. Verschlossene Türen blockieren den Spieler.

---

## Zu erstellende Datei

**Pfad:** `lib/shop/ShopDoor.ts`

---

## Implementierung

### 1. Interface für Tür-Status

```typescript
import { Room } from '../constants';
import { Enemy } from '../Enemy';

export interface ShopDoorStatus {
  isLocked: boolean;
  reason?: string;  // Grund für Sperre (für UI-Anzeige)
}
```

### 2. Prüfung ob Nachbarraum aufgeräumt ist

```typescript
/**
 * Prüft ob ein Raum "aufgeräumt" ist (keine lebenden Gegner).
 */
export function isRoomCleared(
  room: Room,
  enemies: Enemy[]
): boolean {
  const enemiesInRoom = enemies.filter(
    enemy => enemy.roomId === room.id && enemy.alive
  );
  return enemiesInRoom.length === 0;
}

/**
 * Prüft ob alle Nachbarräume eines Shops aufgeräumt sind.
 */
export function areNeighborsCleared(
  shopRoom: Room,
  allRooms: Room[],
  enemies: Enemy[]
): boolean {
  // Alle Nachbarn durchgehen
  for (const neighborId of shopRoom.neighbors) {
    const neighbor = allRooms.find(r => r.id === neighborId);
    if (neighbor && !isRoomCleared(neighbor, enemies)) {
      return false;  // Noch Gegner in diesem Nachbarn
    }
  }
  return true;
}
```

### 3. Shop-Tür-Status ermitteln

```typescript
/**
 * Ermittelt ob die Tür zu einem Shop offen oder geschlossen ist.
 * @param shopRoom - Der Shop-Raum
 * @param playerRoom - Der Raum, in dem der Spieler gerade ist
 * @param allRooms - Alle Räume im Dungeon
 * @param enemies - Alle Gegner
 */
export function getShopDoorStatus(
  shopRoom: Room,
  playerRoom: Room,
  allRooms: Room[],
  enemies: Enemy[]
): ShopDoorStatus {
  // Ist der Spieler bereits im Shop?
  if (playerRoom.id === shopRoom.id) {
    return { isLocked: false };
  }

  // Ist der Spieler-Raum ein Nachbar des Shops?
  const isNeighbor = shopRoom.neighbors.includes(playerRoom.id);
  if (!isNeighbor) {
    return { isLocked: true, reason: 'Nicht erreichbar' };
  }

  // Ist der Spieler-Raum aufgeräumt?
  if (!isRoomCleared(playerRoom, enemies)) {
    const remainingEnemies = enemies.filter(
      e => e.roomId === playerRoom.id && e.alive
    ).length;

    return {
      isLocked: true,
      reason: `Besiege alle Gegner! (${remainingEnemies} übrig)`
    };
  }

  // Alles okay, Tür ist offen
  return { isLocked: false };
}
```

### 4. Zugang prüfen (für Kollision)

```typescript
/**
 * Prüft ob der Spieler den Shop betreten darf.
 * Wird bei Kollision mit Shop-Tür aufgerufen.
 */
export function canEnterShop(
  shopRoom: Room,
  playerRoom: Room,
  enemies: Enemy[]
): boolean {
  // Spieler muss in einem Nachbarraum sein
  if (!shopRoom.neighbors.includes(playerRoom.id)) {
    return false;
  }

  // Spieler-Raum muss aufgeräumt sein
  return isRoomCleared(playerRoom, enemies);
}

/**
 * Gibt die Nachricht zurück, die angezeigt werden soll
 * wenn die Tür verschlossen ist.
 */
export function getLockedDoorMessage(
  playerRoom: Room,
  enemies: Enemy[]
): string {
  const remainingEnemies = enemies.filter(
    e => e.roomId === playerRoom.id && e.alive
  ).length;

  if (remainingEnemies > 0) {
    return `Besiege alle Gegner! (${remainingEnemies} übrig)`;
  }

  return 'Shop nicht erreichbar';
}
```

### 5. Shop-Tür-Status aktualisieren

Diese Funktion sollte regelmäßig im Game-Loop aufgerufen werden:

```typescript
/**
 * Aktualisiert den shopDoorOpen-Status für alle Shop-Räume.
 * Sollte nach jedem Gegner-Tod aufgerufen werden.
 */
export function updateShopDoorStates(
  rooms: Room[],
  enemies: Enemy[]
): void {
  for (const room of rooms) {
    if (room.type !== 'shop') continue;

    // Prüfen ob alle Nachbarn aufgeräumt sind
    const allCleared = areNeighborsCleared(room, rooms, enemies);
    room.shopDoorOpen = allCleared;
  }
}
```

---

## Integration in Game-Loop

In `useGameState.ts` oder `GameEngine.ts`:

```typescript
// Nach einem Kampf (wenn Gegner besiegt wurde):
function onEnemyDefeated(enemy: Enemy): void {
  enemy.alive = false;

  // Shop-Türen aktualisieren
  updateShopDoorStates(dungeonRooms, allEnemies);
}

// Bei Spieler-Bewegung:
function onPlayerMove(newX: number, newY: number): boolean {
  // ... normale Kollisionsprüfung ...

  // Wenn Spieler Shop-Tür erreicht:
  const targetRoom = getRoomAtPosition(newX, newY);
  if (targetRoom && targetRoom.type === 'shop') {
    if (!canEnterShop(targetRoom, currentPlayerRoom, allEnemies)) {
      showMessage(getLockedDoorMessage(currentPlayerRoom, allEnemies));
      return false;  // Bewegung blockieren
    }
  }

  return true;  // Bewegung erlauben
}
```

---

## Testfälle

1. **Shop neben Raum mit Gegnern** → Tür verschlossen
2. **Alle Gegner im Nachbarraum besiegt** → Tür öffnet sich
3. **Shop neben leerem Raum** → Tür sofort offen
4. **Spieler versucht verschlossene Tür** → Wird blockiert + Nachricht
5. **shopDoorOpen wird aktualisiert** → Nach Gegner-Tod

---

## Abnahmekriterien

- [ ] Datei `lib/shop/ShopDoor.ts` existiert
- [ ] `isRoomCleared()` funktioniert korrekt
- [ ] `getShopDoorStatus()` gibt korrekten Status zurück
- [ ] `canEnterShop()` prüft Zugang korrekt
- [ ] `updateShopDoorStates()` aktualisiert alle Shops
- [ ] Verschlossene Türen zeigen Nachricht
- [ ] Türen öffnen sich nach Gegner-Sieg
- [ ] Keine TypeScript-Fehler
