# SHOP-02: Item-System erstellen

**Feature:** Shop-Räume
**Priorität:** Hoch
**Geschätzte Dauer:** 1-2 Stunden
**Vorgänger:** SHOP-01 (Seltenheitssystem)
**Nachfolger:** SHOP-04

---

## Ziel

Ein Item-System erstellen, das alle Ausrüstungsgegenstände definiert, die im Shop gekauft werden können. Items haben verschiedene Typen (Schwert, Rüstung, etc.) und ihre Effektstärke skaliert mit der Seltenheit.

---

## Voraussetzungen

- SHOP-01 muss abgeschlossen sein
- Datei `lib/shop/Rarity.ts` muss existieren

---

## Zu erstellende Datei

**Pfad:** `lib/shop/Item.ts`

---

## Implementierung

### 1. Enum für Item-Typen

```typescript
export enum ItemType {
  SWORD = 'sword',
  CHESTPLATE = 'chestplate',
  HELMET = 'helmet',
  SHIELD = 'shield',
  BOOTS = 'boots',
  AMULET = 'amulet'
}
```

### 2. Enum für Effekt-Typen

```typescript
export enum ItemEffectType {
  DAMAGE_FLAT = 'damage_flat',       // +X Schaden
  DAMAGE_REDUCTION = 'damage_reduction', // -X% eingehender Schaden
  HP_FLAT = 'hp_flat',               // +X max HP
  BLOCK_CHANCE = 'block_chance',     // X% Chance Schaden zu blocken
  SPEED = 'speed',                   // +X% Bewegungsgeschwindigkeit
  ALL_STATS = 'all_stats'            // +X% auf alle Stats
}
```

### 3. Interface für Item-Definition

```typescript
export interface ItemDefinition {
  type: ItemType;
  name: string;
  description: string;
  baseEffect: number;
  effectType: ItemEffectType;
  spriteKey: string;
}
```

### 4. Interface für ein konkretes Item

```typescript
import { Rarity } from './Rarity';

export interface Item {
  id: string;
  definition: ItemDefinition;
  rarity: Rarity;
  effectValue: number;  // baseEffect * rarityMultiplier
}
```

### 5. Alle Item-Definitionen

```typescript
export const ITEM_DEFINITIONS: ItemDefinition[] = [
  {
    type: ItemType.SWORD,
    name: 'Schwert',
    description: 'Erhöht den Schaden bei korrekten Antworten',
    baseEffect: 5,
    effectType: ItemEffectType.DAMAGE_FLAT,
    spriteKey: 'item_sword'
  },
  {
    type: ItemType.CHESTPLATE,
    name: 'Brustplatte',
    description: 'Reduziert eingehenden Schaden',
    baseEffect: 10,
    effectType: ItemEffectType.DAMAGE_REDUCTION,
    spriteKey: 'item_chestplate'
  },
  {
    type: ItemType.HELMET,
    name: 'Helm',
    description: 'Erhöht die maximalen HP',
    baseEffect: 10,
    effectType: ItemEffectType.HP_FLAT,
    spriteKey: 'item_helmet'
  },
  {
    type: ItemType.SHIELD,
    name: 'Schild',
    description: 'Chance, Schaden komplett zu blocken',
    baseEffect: 10,
    effectType: ItemEffectType.BLOCK_CHANCE,
    spriteKey: 'item_shield'
  },
  {
    type: ItemType.BOOTS,
    name: 'Stiefel',
    description: 'Erhöht die Bewegungsgeschwindigkeit',
    baseEffect: 10,
    effectType: ItemEffectType.SPEED,
    spriteKey: 'item_boots'
  },
  {
    type: ItemType.AMULET,
    name: 'Amulett',
    description: 'Verbessert alle Stats leicht',
    baseEffect: 5,
    effectType: ItemEffectType.ALL_STATS,
    spriteKey: 'item_amulet'
  }
];
```

### 6. Hilfsfunktionen

```typescript
import { Rarity, getRarityMultiplier, rollRarity } from './Rarity';

let itemIdCounter = 0;

/**
 * Generiert eine eindeutige Item-ID.
 */
function generateItemId(): string {
  return `item_${Date.now()}_${itemIdCounter++}`;
}

/**
 * Findet eine Item-Definition nach Typ.
 */
export function getItemDefinition(type: ItemType): ItemDefinition | undefined {
  return ITEM_DEFINITIONS.find(def => def.type === type);
}

/**
 * Erstellt ein Item mit spezifischem Typ und Seltenheit.
 */
export function createItem(type: ItemType, rarity: Rarity): Item | null {
  const definition = getItemDefinition(type);
  if (!definition) return null;

  const multiplier = getRarityMultiplier(rarity);
  const effectValue = Math.round(definition.baseEffect * multiplier);

  return {
    id: generateItemId(),
    definition,
    rarity,
    effectValue
  };
}

/**
 * Erstellt ein zufälliges Item mit zufälliger Seltenheit.
 */
export function generateRandomItem(randomFn: () => number = Math.random): Item {
  // Zufälligen Typ wählen
  const types = Object.values(ItemType);
  const randomType = types[Math.floor(randomFn() * types.length)];

  // Zufällige Seltenheit würfeln
  const rarity = rollRarity(randomFn);

  return createItem(randomType, rarity)!;
}

/**
 * Gibt eine lesbare Beschreibung des Item-Effekts zurück.
 */
export function getItemEffectDescription(item: Item): string {
  const { effectType } = item.definition;
  const value = item.effectValue;

  switch (effectType) {
    case ItemEffectType.DAMAGE_FLAT:
      return `+${value} Schaden`;
    case ItemEffectType.DAMAGE_REDUCTION:
      return `-${value}% eingehender Schaden`;
    case ItemEffectType.HP_FLAT:
      return `+${value} max HP`;
    case ItemEffectType.BLOCK_CHANCE:
      return `${value}% Block-Chance`;
    case ItemEffectType.SPEED:
      return `+${value}% Geschwindigkeit`;
    case ItemEffectType.ALL_STATS:
      return `+${value}% alle Stats`;
    default:
      return `+${value}`;
  }
}
```

---

## Beispiel-Ausgabe

Ein legendäres Schwert hätte:
- baseEffect: 5
- rarityMultiplier: 5.0
- effectValue: 25 (= 5 * 5)
- Beschreibung: "+25 Schaden"

Ein gewöhnlicher Helm hätte:
- baseEffect: 10
- rarityMultiplier: 1.0
- effectValue: 10 (= 10 * 1)
- Beschreibung: "+10 max HP"

---

## Testfälle

1. **createItem('sword', 'common')** → Item mit effectValue = 5
2. **createItem('sword', 'legendary')** → Item mit effectValue = 25
3. **generateRandomItem()** → Zufälliges gültiges Item
4. **getItemEffectDescription()** → Korrekte Textbeschreibung

---

## Abnahmekriterien

- [ ] Datei `lib/shop/Item.ts` existiert
- [ ] Alle 6 Item-Typen definiert
- [ ] Alle Effekt-Typen definiert
- [ ] `createItem()` erstellt Items mit korrektem effectValue
- [ ] `generateRandomItem()` funktioniert
- [ ] `getItemEffectDescription()` gibt lesbare Texte zurück
- [ ] Import von Rarity funktioniert
- [ ] Keine TypeScript-Fehler
