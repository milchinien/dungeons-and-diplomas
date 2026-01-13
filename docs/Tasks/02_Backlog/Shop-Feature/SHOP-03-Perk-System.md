# SHOP-03: Perk-System erstellen

**Feature:** Shop-Räume
**Priorität:** Hoch
**Geschätzte Dauer:** 1-2 Stunden
**Vorgänger:** SHOP-01 (Seltenheitssystem)
**Nachfolger:** SHOP-04

---

## Ziel

Ein Perk-System erstellen, das alle permanenten Boni definiert, die im Shop erworben werden können. Perks sind ähnlich wie beim bestehenden Schrein-System, aber mit Seltenheitsstufen.

---

## Voraussetzungen

- SHOP-01 muss abgeschlossen sein
- Datei `lib/shop/Rarity.ts` muss existieren

---

## Zu erstellende Datei

**Pfad:** `lib/shop/Perk.ts`

---

## Implementierung

### 1. Enum für Perk-Typen

```typescript
export enum PerkType {
  HP_FLAT = 'hp_flat',
  HP_PERCENT = 'hp_percent',
  DAMAGE_FLAT = 'damage_flat',
  DAMAGE_PERCENT = 'damage_percent',
  REGENERATION = 'regeneration',
  CRITICAL = 'critical',
  TIME_BONUS = 'time_bonus',
  EXTRA_LIFE = 'extra_life',
  ELO_BOOST = 'elo_boost'
}
```

### 2. Interface für Perk-Definition

```typescript
export interface PerkDefinition {
  type: PerkType;
  name: string;
  description: string;
  baseEffect: number;
  iconKey: string;
}
```

### 3. Interface für einen konkreten Perk

```typescript
import { Rarity } from './Rarity';

export interface Perk {
  id: string;
  definition: PerkDefinition;
  rarity: Rarity;
  effectValue: number;  // baseEffect * rarityMultiplier
}
```

### 4. Alle Perk-Definitionen

```typescript
export const PERK_DEFINITIONS: PerkDefinition[] = [
  {
    type: PerkType.HP_FLAT,
    name: '+HP',
    description: 'Erhöht die maximalen HP um einen festen Wert',
    baseEffect: 5,
    iconKey: 'perk_hp_flat'
  },
  {
    type: PerkType.HP_PERCENT,
    name: '+HP%',
    description: 'Erhöht die maximalen HP prozentual',
    baseEffect: 5,
    iconKey: 'perk_hp_percent'
  },
  {
    type: PerkType.DAMAGE_FLAT,
    name: '+Schaden',
    description: 'Erhöht den Basis-Schaden',
    baseEffect: 3,
    iconKey: 'perk_damage_flat'
  },
  {
    type: PerkType.DAMAGE_PERCENT,
    name: '+Schaden%',
    description: 'Erhöht den Schaden prozentual',
    baseEffect: 5,
    iconKey: 'perk_damage_percent'
  },
  {
    type: PerkType.REGENERATION,
    name: 'Regeneration',
    description: 'Regeneriert HP über Zeit',
    baseEffect: 1,  // HP pro 5 Sekunden
    iconKey: 'perk_regeneration'
  },
  {
    type: PerkType.CRITICAL,
    name: 'Kritisch',
    description: 'Chance auf doppelten Schaden',
    baseEffect: 10,  // Prozent
    iconKey: 'perk_critical'
  },
  {
    type: PerkType.TIME_BONUS,
    name: 'Zeitbonus',
    description: 'Mehr Zeit bei Quiz-Fragen',
    baseEffect: 2,  // Sekunden
    iconKey: 'perk_time_bonus'
  },
  {
    type: PerkType.EXTRA_LIFE,
    name: 'Extra Leben',
    description: 'Einmal bei 0 HP wiederbeleben',
    baseEffect: 1,  // Anzahl Leben
    iconKey: 'perk_extra_life'
  },
  {
    type: PerkType.ELO_BOOST,
    name: 'ELO-Boost',
    description: 'Verbessert alle Fach-ELOs',
    baseEffect: 1,
    iconKey: 'perk_elo_boost'
  }
];
```

### 5. Hilfsfunktionen

```typescript
import { Rarity, getRarityMultiplier, rollRarity } from './Rarity';

let perkIdCounter = 0;

/**
 * Generiert eine eindeutige Perk-ID.
 */
function generatePerkId(): string {
  return `perk_${Date.now()}_${perkIdCounter++}`;
}

/**
 * Findet eine Perk-Definition nach Typ.
 */
export function getPerkDefinition(type: PerkType): PerkDefinition | undefined {
  return PERK_DEFINITIONS.find(def => def.type === type);
}

/**
 * Erstellt einen Perk mit spezifischem Typ und Seltenheit.
 */
export function createPerk(type: PerkType, rarity: Rarity): Perk | null {
  const definition = getPerkDefinition(type);
  if (!definition) return null;

  const multiplier = getRarityMultiplier(rarity);

  // Spezielle Behandlung für Extra Leben (immer ganzzahlig, max 3)
  let effectValue: number;
  if (type === PerkType.EXTRA_LIFE) {
    effectValue = Math.min(Math.floor(definition.baseEffect * multiplier), 3);
  } else {
    effectValue = Math.round(definition.baseEffect * multiplier);
  }

  return {
    id: generatePerkId(),
    definition,
    rarity,
    effectValue
  };
}

/**
 * Erstellt einen zufälligen Perk mit zufälliger Seltenheit.
 */
export function generateRandomPerk(randomFn: () => number = Math.random): Perk {
  // Zufälligen Typ wählen
  const types = Object.values(PerkType);
  const randomType = types[Math.floor(randomFn() * types.length)];

  // Zufällige Seltenheit würfeln
  const rarity = rollRarity(randomFn);

  return createPerk(randomType, rarity)!;
}

/**
 * Gibt eine lesbare Beschreibung des Perk-Effekts zurück.
 */
export function getPerkEffectDescription(perk: Perk): string {
  const { type } = perk.definition;
  const value = perk.effectValue;

  switch (type) {
    case PerkType.HP_FLAT:
      return `+${value} HP`;
    case PerkType.HP_PERCENT:
      return `+${value}% HP`;
    case PerkType.DAMAGE_FLAT:
      return `+${value} Schaden`;
    case PerkType.DAMAGE_PERCENT:
      return `+${value}% Schaden`;
    case PerkType.REGENERATION:
      return `+${value} HP/5s`;
    case PerkType.CRITICAL:
      return `${value}% Kritisch`;
    case PerkType.TIME_BONUS:
      return `+${value}s Quiz-Zeit`;
    case PerkType.EXTRA_LIFE:
      return `${value} Extra Leben`;
    case PerkType.ELO_BOOST:
      return `+${value} ELO`;
    default:
      return `+${value}`;
  }
}
```

---

## Beispiel-Ausgabe

Ein legendärer HP-Perk hätte:
- baseEffect: 5
- rarityMultiplier: 5.0
- effectValue: 25 (= 5 * 5)
- Beschreibung: "+25 HP"

Ein episches Extra-Leben hätte:
- baseEffect: 1
- rarityMultiplier: 3.0
- effectValue: 3 (Maximum)
- Beschreibung: "3 Extra Leben"

---

## Unterschied zu Items

| Aspekt | Items | Perks |
|--------|-------|-------|
| Anzahl Typen | 6 | 9 |
| Ausrüstung | Ja (Slots) | Nein (stapelbar) |
| Mehrfach möglich | Nein (1 pro Typ) | Ja (gleicher Perk mehrfach) |
| Effekt-Art | Passiv (Equipment) | Passiv (dauerhaft) |

---

## Testfälle

1. **createPerk('hp_flat', 'common')** → Perk mit effectValue = 5
2. **createPerk('hp_flat', 'legendary')** → Perk mit effectValue = 25
3. **createPerk('extra_life', 'legendary')** → Perk mit effectValue = 3 (Maximum)
4. **generateRandomPerk()** → Zufälliger gültiger Perk
5. **getPerkEffectDescription()** → Korrekte Textbeschreibung

---

## Abnahmekriterien

- [ ] Datei `lib/shop/Perk.ts` existiert
- [ ] Alle 9 Perk-Typen definiert
- [ ] `createPerk()` erstellt Perks mit korrektem effectValue
- [ ] `generateRandomPerk()` funktioniert
- [ ] `getPerkEffectDescription()` gibt lesbare Texte zurück
- [ ] Extra Leben hat Maximum von 3
- [ ] Import von Rarity funktioniert
- [ ] Keine TypeScript-Fehler
