/**
 * Rarity system for the shop feature.
 * Defines 5 rarity tiers with different colors, spawn weights, and effect multipliers.
 */

export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface RarityConfig {
  name: string;           // Display name (e.g., "Legendär")
  color: string;          // Hex color code for aura/text
  glowIntensity: number;  // Glow effect intensity (0-1)
  spawnWeight: number;    // Weight for spawn probability
  effectMultiplier: number; // Multiplier for effect strength
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  [Rarity.COMMON]: {
    name: 'Common',
    color: '#9CA3AF',
    glowIntensity: 0,
    spawnWeight: 50,
    effectMultiplier: 1.0
  },
  [Rarity.UNCOMMON]: {
    name: 'Uncommon',
    color: '#22C55E',
    glowIntensity: 0.3,
    spawnWeight: 25,
    effectMultiplier: 1.5
  },
  [Rarity.RARE]: {
    name: 'Rare',
    color: '#3B82F6',
    glowIntensity: 0.5,
    spawnWeight: 15,
    effectMultiplier: 2.0
  },
  [Rarity.EPIC]: {
    name: 'Epic',
    color: '#A855F7',
    glowIntensity: 0.7,
    spawnWeight: 8,
    effectMultiplier: 3.0
  },
  [Rarity.LEGENDARY]: {
    name: 'Legendär',
    color: '#F59E0B',
    glowIntensity: 1.0,
    spawnWeight: 2,
    effectMultiplier: 5.0
  }
};

/**
 * Rolls a random rarity based on spawn weights.
 * @param randomFn - Optional random function (default: Math.random)
 * @returns A rarity
 */
export function rollRarity(randomFn: () => number = Math.random): Rarity {
  const totalWeight = Object.values(RARITY_CONFIG).reduce(
    (sum, config) => sum + config.spawnWeight,
    0
  );

  let roll = randomFn() * totalWeight;

  for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
    roll -= config.spawnWeight;
    if (roll <= 0) {
      return rarity as Rarity;
    }
  }

  return Rarity.COMMON; // Fallback
}

/**
 * Returns the color for a rarity.
 */
export function getRarityColor(rarity: Rarity): string {
  return RARITY_CONFIG[rarity].color;
}

/**
 * Returns the effect multiplier for a rarity.
 */
export function getRarityMultiplier(rarity: Rarity): number {
  return RARITY_CONFIG[rarity].effectMultiplier;
}

/**
 * Returns the glow intensity for a rarity.
 */
export function getRarityGlow(rarity: Rarity): number {
  return RARITY_CONFIG[rarity].glowIntensity;
}
