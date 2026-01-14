# SHOP-04: Shop-Inventar-System erstellen

**Feature:** Shop-Räume
**Priorität:** Hoch
**Geschätzte Dauer:** 1 Stunde
**Vorgänger:** SHOP-02 (Item-System), SHOP-03 (Perk-System)
**Nachfolger:** SHOP-06

---

## Ziel

Eine Datenstruktur für das Shop-Inventar erstellen, die 3 Items und 3 Perks pro Shop verwaltet. Das Inventar wird bei Raum-Generierung erstellt und speichert, welche Waren bereits gekauft wurden.

---

## Voraussetzungen

- SHOP-02 und SHOP-03 müssen abgeschlossen sein
- Dateien `lib/shop/Item.ts` und `lib/shop/Perk.ts` müssen existieren

---

## Zu erstellende Datei

**Pfad:** `lib/shop/ShopInventory.ts`

---

## Implementierung

### 1. Interface für Shop-Inventar

```typescript
import { Item, generateRandomItem } from './Item';
import { Perk, generateRandomPerk } from './Perk';

export interface ShopInventory {
  shopRoomId: number;
  items: (Item | null)[];   // 3 Items, null wenn gekauft
  perks: (Perk | null)[];   // 3 Perks, null wenn gekauft
}
```

### 2. Konstanten

```typescript
export const SHOP_ITEMS_COUNT = 3;
export const SHOP_PERKS_COUNT = 3;
```

### 3. Inventar-Generierung

```typescript
/**
 * Generiert ein vollständiges Shop-Inventar mit 3 Items und 3 Perks.
 * @param roomId - Die ID des Shop-Raums
 * @param randomFn - Optionale Zufallsfunktion für deterministische Tests
 */
export function generateShopInventory(
  roomId: number,
  randomFn: () => number = Math.random
): ShopInventory {
  const items: Item[] = [];
  const perks: Perk[] = [];

  // 3 zufällige Items generieren
  for (let i = 0; i < SHOP_ITEMS_COUNT; i++) {
    items.push(generateRandomItem(randomFn));
  }

  // 3 zufällige Perks generieren
  for (let i = 0; i < SHOP_PERKS_COUNT; i++) {
    perks.push(generateRandomPerk(randomFn));
  }

  return {
    shopRoomId: roomId,
    items,
    perks
  };
}
```

### 4. Kauf-Funktionen

```typescript
/**
 * Markiert ein Item als gekauft (setzt auf null).
 * @returns Das gekaufte Item oder null wenn bereits gekauft/ungültiger Index
 */
export function purchaseItem(
  inventory: ShopInventory,
  itemIndex: number
): Item | null {
  if (itemIndex < 0 || itemIndex >= inventory.items.length) {
    return null;
  }

  const item = inventory.items[itemIndex];
  if (item === null) {
    return null; // Bereits gekauft
  }

  inventory.items[itemIndex] = null;
  return item;
}

/**
 * Markiert einen Perk als gekauft (setzt auf null).
 * @returns Der gekaufte Perk oder null wenn bereits gekauft/ungültiger Index
 */
export function purchasePerk(
  inventory: ShopInventory,
  perkIndex: number
): Perk | null {
  if (perkIndex < 0 || perkIndex >= inventory.perks.length) {
    return null;
  }

  const perk = inventory.perks[perkIndex];
  if (perk === null) {
    return null; // Bereits gekauft
  }

  inventory.perks[perkIndex] = null;
  return perk;
}
```

### 5. Hilfsfunktionen

```typescript
/**
 * Prüft ob noch Items im Shop verfügbar sind.
 */
export function hasAvailableItems(inventory: ShopInventory): boolean {
  return inventory.items.some(item => item !== null);
}

/**
 * Prüft ob noch Perks im Shop verfügbar sind.
 */
export function hasAvailablePerks(inventory: ShopInventory): boolean {
  return inventory.perks.some(perk => perk !== null);
}

/**
 * Prüft ob der Shop noch Waren hat.
 */
export function isShopEmpty(inventory: ShopInventory): boolean {
  return !hasAvailableItems(inventory) && !hasAvailablePerks(inventory);
}

/**
 * Gibt die Anzahl der verfügbaren Items zurück.
 */
export function countAvailableItems(inventory: ShopInventory): number {
  return inventory.items.filter(item => item !== null).length;
}

/**
 * Gibt die Anzahl der verfügbaren Perks zurück.
 */
export function countAvailablePerks(inventory: ShopInventory): number {
  return inventory.perks.filter(perk => perk !== null).length;
}
```

---

## Beispiel-Nutzung

```typescript
// Shop-Inventar generieren
const inventory = generateShopInventory(42);

console.log(inventory.items.length);  // 3
console.log(inventory.perks.length);  // 3

// Item kaufen
const purchasedItem = purchaseItem(inventory, 0);
console.log(purchasedItem);           // Das Item-Objekt
console.log(inventory.items[0]);      // null (gekauft)

// Nochmal versuchen zu kaufen
const secondTry = purchaseItem(inventory, 0);
console.log(secondTry);               // null (bereits gekauft)

// Shop-Status prüfen
console.log(isShopEmpty(inventory));  // false
console.log(countAvailableItems(inventory)); // 2
```

---

## Testfälle

1. **generateShopInventory(1)** → Inventar mit 3 Items und 3 Perks
2. **purchaseItem(inv, 0)** → Gibt Item zurück, setzt auf null
3. **purchaseItem(inv, 0)** (nochmal) → Gibt null zurück
4. **purchaseItem(inv, 99)** → Gibt null zurück (ungültiger Index)
5. **isShopEmpty()** nach allen Käufen → true

---

## Abnahmekriterien

- [ ] Datei `lib/shop/ShopInventory.ts` existiert
- [ ] `ShopInventory` Interface definiert
- [ ] `generateShopInventory()` erstellt 3 Items und 3 Perks
- [ ] `purchaseItem()` funktioniert korrekt
- [ ] `purchasePerk()` funktioniert korrekt
- [ ] `isShopEmpty()` und andere Hilfsfunktionen funktionieren
- [ ] Imports von Item.ts und Perk.ts funktionieren
- [ ] Keine TypeScript-Fehler
