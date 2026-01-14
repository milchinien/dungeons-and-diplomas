# SHOP-05: Konstanten und Player-Interface erweitern

**Feature:** Shop-Räume
**Priorität:** Hoch
**Geschätzte Dauer:** 1 Stunde
**Vorgänger:** SHOP-01, SHOP-02, SHOP-03
**Nachfolger:** SHOP-06, SHOP-07

---

## Ziel

Die bestehende `lib/constants.ts` Datei erweitern um:
1. Neue Shop-bezogene Konstanten
2. Den Room-Typ `'shop'`
3. Das Player-Interface mit Items, Perks und Bonus-Stats

---

## Zu bearbeitende Datei

**Pfad:** `lib/constants.ts`

---

## Implementierung

### 1. Neue Shop-Konstanten hinzufügen

Füge folgende Konstanten am Ende des Konstanten-Bereichs hinzu:

```typescript
// ============================================
// SHOP CONSTANTS
// ============================================

/** Wahrscheinlichkeit, dass ein Raum ein Shop wird (8%) */
export const SHOP_SPAWN_CHANCE = 0.08;

/** Mindestgröße eines Raums um ein Shop zu werden (in Tiles) */
export const SHOP_MIN_ROOM_SIZE = 6;

/** Anzahl der Items pro Shop */
export const SHOP_ITEMS_COUNT = 3;

/** Anzahl der Perks pro Shop */
export const SHOP_PERKS_COUNT = 3;

/** Maximale Anzahl von Shops pro Dungeon */
export const SHOP_MAX_PER_DUNGEON = 2;

/** Amplitude der Schweb-Animation (in Tiles) */
export const FLOATING_ITEM_AMPLITUDE = 0.3;

/** Geschwindigkeit der Schweb-Animation (Zyklen pro Sekunde) */
export const FLOATING_ITEM_SPEED = 2;

/** Puls-Geschwindigkeit für Legendary Items (Zyklen pro Sekunde) */
export const LEGENDARY_PULSE_SPEED = 1;
```

### 2. Room-Typ erweitern

Finde das bestehende Room-Interface und erweitere den `type`:

**Vorher:**
```typescript
export interface Room {
  // ... bestehende Felder
  type: 'empty' | 'treasure' | 'combat';
}
```

**Nachher:**
```typescript
import { ShopInventory } from './shop/ShopInventory';

export interface Room {
  // ... bestehende Felder
  type: 'empty' | 'treasure' | 'combat' | 'shop';
  shopInventory?: ShopInventory;  // Nur bei type === 'shop'
  shopDoorOpen?: boolean;         // Nur bei type === 'shop', Standard: false
}
```

### 3. BonusStats Interface erstellen

```typescript
/** Alle Bonus-Werte, die durch Items und Perks gewährt werden */
export interface BonusStats {
  /** Zusätzlicher flacher Schaden bei korrekten Antworten */
  damageFlat: number;

  /** Prozentuale Schadenserhöhung (0-100) */
  damagePercent: number;

  /** Prozentuale Schadensreduktion bei falschen Antworten (0-100) */
  damageReduction: number;

  /** Zusätzliche maximale HP */
  maxHpBonus: number;

  /** Geschwindigkeitsmultiplikator (1.0 = normal) */
  speedMultiplier: number;

  /** Block-Chance in Prozent (0-100) */
  blockChance: number;

  /** Kritische Treffer-Chance in Prozent (0-100) */
  criticalChance: number;

  /** Zusätzliche Sekunden für Quiz-Fragen */
  timeBonus: number;

  /** Anzahl Extra-Leben */
  extraLives: number;

  /** ELO-Bonus für alle Fächer */
  eloBonus: number;

  /** HP-Regeneration pro Sekunde */
  regeneration: number;
}
```

### 4. Standard-BonusStats

```typescript
/** Standard-Werte für BonusStats (keine Boni) */
export const DEFAULT_BONUS_STATS: BonusStats = {
  damageFlat: 0,
  damagePercent: 0,
  damageReduction: 0,
  maxHpBonus: 0,
  speedMultiplier: 1.0,
  blockChance: 0,
  criticalChance: 0,
  timeBonus: 0,
  extraLives: 0,
  eloBonus: 0,
  regeneration: 0
};
```

### 5. Player-Interface erweitern

Finde das bestehende Player-Interface und erweitere es:

**Vorher:**
```typescript
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  isMoving: boolean;
  hp: number;
  maxHp: number;
}
```

**Nachher:**
```typescript
import { Item } from './shop/Item';
import { Perk } from './shop/Perk';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  isMoving: boolean;
  hp: number;
  maxHp: number;

  // NEU: Shop-System
  equippedItems: Item[];
  activePerks: Perk[];
  bonusStats: BonusStats;
}
```

### 6. Player-Initialisierung anpassen

Falls es eine Funktion zur Player-Initialisierung gibt, diese erweitern:

```typescript
export function createInitialPlayer(): Player {
  return {
    x: 0,
    y: 0,
    width: TILE_SIZE * PLAYER_SIZE,
    height: TILE_SIZE * PLAYER_SIZE,
    direction: 'down',
    isMoving: false,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,

    // NEU
    equippedItems: [],
    activePerks: [],
    bonusStats: { ...DEFAULT_BONUS_STATS }
  };
}
```

---

## Import-Hinweise

Am Anfang der Datei müssen ggf. neue Imports hinzugefügt werden:

```typescript
import { ShopInventory } from './shop/ShopInventory';
import { Item } from './shop/Item';
import { Perk } from './shop/Perk';
```

**Achtung:** Falls zirkuläre Imports entstehen, die Typen inline definieren oder in eine separate Typen-Datei auslagern.

---

## Testfälle

1. Neue Konstanten sind exportiert und haben korrekte Werte
2. Room mit `type: 'shop'` ist gültig
3. Player mit `equippedItems`, `activePerks`, `bonusStats` ist gültig
4. `DEFAULT_BONUS_STATS` hat alle Werte auf 0/1.0

---

## Abnahmekriterien

- [ ] Alle neuen Shop-Konstanten hinzugefügt
- [ ] Room-Interface um `'shop'` erweitert
- [ ] Room-Interface hat optionale `shopInventory` und `shopDoorOpen` Felder
- [ ] `BonusStats` Interface erstellt
- [ ] `DEFAULT_BONUS_STATS` Konstante erstellt
- [ ] Player-Interface um Items, Perks und BonusStats erweitert
- [ ] Keine TypeScript-Fehler
- [ ] Keine zirkulären Import-Probleme
