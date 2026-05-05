/**
 * Perk system for the shop feature.
 * Defines all permanent bonuses that can be purchased in the shop.
 * Similar to the existing shrine system, but with rarity tiers.
 */

import { Rarity, getRarityMultiplier, rollRarity } from './Rarity';

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

export interface PerkDefinition {
  type: PerkType;
  name: string;
  description: string;
  baseEffect: number;
  iconKey: string;
  baseCost: number;  // Base gold cost before rarity multiplier
}

export interface Perk {
  id: string;
  definition: PerkDefinition;
  rarity: Rarity;
  effectValue: number;  // baseEffect * rarityMultiplier
  finalCost: number;    // baseCost * rarityMultiplier
}

export const PERK_DEFINITIONS: PerkDefinition[] = [
  {
    type: PerkType.HP_FLAT,
    name: '+HP',
    description: 'Erhöht die maximalen HP um einen festen Wert',
    baseEffect: 5,
    iconKey: 'perk_hp_flat',
    baseCost: 30
  },
  {
    type: PerkType.HP_PERCENT,
    name: '+HP%',
    description: 'Erhöht die maximalen HP prozentual',
    baseEffect: 5,
    iconKey: 'perk_hp_percent',
    baseCost: 40
  },
  {
    type: PerkType.DAMAGE_FLAT,
    name: '+Schaden',
    description: 'Erhöht den Basis-Schaden',
    baseEffect: 3,
    iconKey: 'perk_damage_flat',
    baseCost: 50
  },
  {
    type: PerkType.DAMAGE_PERCENT,
    name: '+Schaden%',
    description: 'Erhöht den Schaden prozentual',
    baseEffect: 5,
    iconKey: 'perk_damage_percent',
    baseCost: 60
  },
  {
    type: PerkType.REGENERATION,
    name: 'Regeneration',
    description: 'Regeneriert HP über Zeit',
    baseEffect: 1,  // HP per 5 seconds
    iconKey: 'perk_regeneration',
    baseCost: 70
  },
  {
    type: PerkType.CRITICAL,
    name: 'Kritisch',
    description: 'Chance auf doppelten Schaden',
    baseEffect: 10,  // Percent
    iconKey: 'perk_critical',
    baseCost: 80
  },
  {
    type: PerkType.TIME_BONUS,
    name: 'Zeitbonus',
    description: 'Mehr Zeit bei Quiz-Fragen',
    baseEffect: 2,  // Seconds
    iconKey: 'perk_time_bonus',
    baseCost: 55
  },
  {
    type: PerkType.EXTRA_LIFE,
    name: 'Extra Leben',
    description: 'Einmal bei 0 HP wiederbeleben',
    baseEffect: 1,  // Number of lives
    iconKey: 'perk_extra_life',
    baseCost: 100
  },
  {
    type: PerkType.ELO_BOOST,
    name: 'ELO-Boost',
    description: 'Verbessert alle Fach-ELOs',
    baseEffect: 1,
    iconKey: 'perk_elo_boost',
    baseCost: 90
  }
];

let perkIdCounter = 0;

/**
 * Generates a unique perk ID.
 */
function generatePerkId(): string {
  return `perk_${Date.now()}_${perkIdCounter++}`;
}

/**
 * Finds a perk definition by type.
 */
export function getPerkDefinition(type: PerkType): PerkDefinition | undefined {
  return PERK_DEFINITIONS.find(def => def.type === type);
}

/**
 * Creates a perk with specific type and rarity.
 */
export function createPerk(type: PerkType, rarity: Rarity): Perk | null {
  const definition = getPerkDefinition(type);
  if (!definition) return null;

  const multiplier = getRarityMultiplier(rarity);

  // Special handling for Extra Life (always integer, max 3)
  let effectValue: number;
  if (type === PerkType.EXTRA_LIFE) {
    effectValue = Math.min(Math.floor(definition.baseEffect * multiplier), 3);
  } else {
    effectValue = Math.round(definition.baseEffect * multiplier);
  }

  const finalCost = Math.round(definition.baseCost * multiplier);

  return {
    id: generatePerkId(),
    definition,
    rarity,
    effectValue,
    finalCost
  };
}

/**
 * Creates a random perk with random rarity.
 */
export function generateRandomPerk(randomFn: () => number = Math.random): Perk {
  // Choose random type
  const types = Object.values(PerkType);
  const randomType = types[Math.floor(randomFn() * types.length)];

  // Roll random rarity
  const rarity = rollRarity(randomFn);

  return createPerk(randomType, rarity)!;
}

/**
 * Returns a readable description of the perk effect.
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
