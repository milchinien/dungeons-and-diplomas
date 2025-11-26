/**
 * Global RNG instances for dungeon generation
 *
 * Three separate RNG streams for independent control:
 * - structureRng: Controls dungeon layout (BSP, rooms, doors)
 * - decorationRng: Controls visual variance (tile variants, decorations)
 * - spawnRng: Controls entity spawning (player, enemies, treasures)
 *
 * This allows:
 * - Same structure with different decorations/spawns
 * - Same structure+decoration with different spawns
 * - Reproducible dungeons for testing
 * - Challenge mode with identical layouts
 */

import { SeededRandom } from './SeededRandom';

// Default seeds (will be overwritten when generateNewDungeon is called)
let structureRng = new SeededRandom(1);
let decorationRng = new SeededRandom(1);
let spawnRng = new SeededRandom(1);

/**
 * Initialize all RNG instances with new seeds
 */
export function initializeDungeonRNG(structureSeed: number, decorationSeed: number, spawnSeed: number): void {
  structureRng = new SeededRandom(structureSeed);
  decorationRng = new SeededRandom(decorationSeed);
  spawnRng = new SeededRandom(spawnSeed);
}

/**
 * Get the structure RNG (for BSP, rooms, connections)
 */
export function getStructureRng(): SeededRandom {
  return structureRng;
}

/**
 * Get the decoration RNG (for tile variants, decorations)
 */
export function getDecorationRng(): SeededRandom {
  return decorationRng;
}

/**
 * Get the spawn RNG (for player, enemies, treasures)
 */
export function getSpawnRng(): SeededRandom {
  return spawnRng;
}

/**
 * Generate a random seed from current timestamp
 * Useful for generating new random dungeons
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 0xFFFFFFFF);
}
