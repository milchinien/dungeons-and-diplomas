# SHOP-06: Shop-Räume in Dungeon-Generierung integrieren

**Feature:** Shop-Räume
**Priorität:** Hoch
**Geschätzte Dauer:** 1-2 Stunden
**Vorgänger:** SHOP-04, SHOP-05
**Nachfolger:** SHOP-07, SHOP-10

---

## Ziel

Die Dungeon-Generierung erweitern, sodass Shop-Räume mit einer bestimmten Wahrscheinlichkeit anstelle anderer Raumtypen erscheinen. Shops erhalten bei der Generierung ihr Inventar.

---

## Voraussetzungen

- SHOP-04 (ShopInventory) muss abgeschlossen sein
- SHOP-05 (Konstanten) muss abgeschlossen sein

---

## Zu bearbeitende Datei

**Pfad:** `lib/dungeon/generation.ts`

---

## Implementierung

### 1. Imports hinzufügen

Am Anfang der Datei:

```typescript
import { generateShopInventory } from '../shop/ShopInventory';
import {
  SHOP_SPAWN_CHANCE,
  SHOP_MIN_ROOM_SIZE,
  SHOP_MAX_PER_DUNGEON
} from '../constants';
```

### 2. Funktion zur Shop-Zuweisung erstellen

```typescript
/**
 * Prüft ob ein Raum groß genug für einen Shop ist.
 */
function isRoomLargeEnough(room: Room): boolean {
  return room.width >= SHOP_MIN_ROOM_SIZE && room.height >= SHOP_MIN_ROOM_SIZE;
}

/**
 * Weist Shop-Räume zu, nachdem die normalen Raumtypen vergeben wurden.
 * @param rooms - Array aller Räume
 * @param startRoomIndex - Index des Startraums (wird nie zum Shop)
 * @param randomFn - Zufallsfunktion
 */
function assignShopRooms(
  rooms: Room[],
  startRoomIndex: number,
  randomFn: () => number = Math.random
): void {
  let shopCount = 0;

  for (let i = 0; i < rooms.length; i++) {
    // Startraum niemals zum Shop machen
    if (i === startRoomIndex) continue;

    // Maximum erreicht?
    if (shopCount >= SHOP_MAX_PER_DUNGEON) break;

    // Raum groß genug?
    if (!isRoomLargeEnough(rooms[i])) continue;

    // Zufällige Chance
    if (randomFn() < SHOP_SPAWN_CHANCE) {
      rooms[i].type = 'shop';
      rooms[i].shopInventory = generateShopInventory(rooms[i].id, randomFn);
      rooms[i].shopDoorOpen = false;
      shopCount++;
    }
  }
}
```

### 3. In bestehende Generierung einbinden

Finde die Funktion, die Raumtypen zuweist (z.B. `assignRoomTypes` oder ähnlich) und füge den Shop-Aufruf hinzu:

```typescript
// Beispiel: Falls es eine Funktion wie diese gibt
function assignRoomTypes(rooms: Room[], startRoomIndex: number): void {
  // Bestehende Logik für empty, treasure, combat
  for (const room of rooms) {
    const roll = Math.random();
    if (roll < 0.1) {
      room.type = 'combat';
    } else if (roll < 0.3) {
      room.type = 'treasure';
    } else {
      room.type = 'empty';
    }
  }

  // NEU: Shops zuweisen (überschreibt ggf. andere Typen)
  assignShopRooms(rooms, startRoomIndex);
}
```

**Alternative:** Falls die Raumtyp-Zuweisung in der Hauptgenerierung geschieht:

```typescript
function generateDungeon(): DungeonData {
  // ... bestehende Generierungslogik ...

  // Räume erstellen
  const rooms = createRooms(/* ... */);

  // Raumtypen zuweisen
  assignRoomTypes(rooms, startRoomIndex);

  // NEU: Shop-Räume hinzufügen
  assignShopRooms(rooms, startRoomIndex);

  // ... Rest der Generierung ...
}
```

### 4. Sicherstellen, dass keine Gegner in Shops spawnen

Falls Gegner pro Raum gespawnt werden, diese Logik anpassen:

```typescript
function spawnEnemiesInRoom(room: Room): Enemy[] {
  // KEINE Gegner in Shop-Räumen!
  if (room.type === 'shop') {
    return [];
  }

  // Bestehende Spawn-Logik...
}
```

---

## Wichtige Punkte

1. **Reihenfolge beachten:** Shop-Zuweisung sollte NACH der normalen Typ-Zuweisung erfolgen
2. **Startraum schützen:** Der Spieler-Startraum darf NIE ein Shop sein
3. **Maximum beachten:** Maximal 2 Shops pro Dungeon
4. **Größe prüfen:** Nur Räume >= 6x6 Tiles können Shops werden

---

## Erwartetes Verhalten

Bei einem Dungeon mit 20 Räumen:
- ~8% Chance pro geeignetem Raum = ~1-2 Shops pro Dungeon
- Shops haben sofort ihr Inventar
- Shops haben `shopDoorOpen: false`
- Keine Gegner in Shop-Räumen

---

## Testfälle

1. Dungeon generieren → Shops erscheinen manchmal
2. Startraum → Ist nie ein Shop
3. Kleine Räume → Werden nie zu Shops
4. Shop-Raum → Hat `shopInventory` mit 3 Items und 3 Perks
5. Mehrere Dungeons generieren → Max 2 Shops pro Dungeon

---

## Debug-Hilfe

Temporär zum Testen einbauen:

```typescript
// Am Ende der Generierung
const shopCount = rooms.filter(r => r.type === 'shop').length;
console.log(`Dungeon generiert: ${rooms.length} Räume, ${shopCount} Shops`);
```

---

## Abnahmekriterien

- [ ] `assignShopRooms` Funktion erstellt
- [ ] Shop-Räume werden mit korrekter Wahrscheinlichkeit generiert
- [ ] Startraum ist nie ein Shop
- [ ] Kleine Räume werden keine Shops
- [ ] Maximum 2 Shops pro Dungeon
- [ ] Shop-Räume haben `shopInventory` mit 3 Items und 3 Perks
- [ ] Shop-Räume haben `shopDoorOpen: false`
- [ ] Keine Gegner spawnen in Shop-Räumen
- [ ] Keine TypeScript-Fehler
