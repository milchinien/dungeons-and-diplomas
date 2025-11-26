/**
 * Dungeon Initialization Module
 *
 * Handles dungeon structure generation:
 * - Empty dungeon creation
 * - Room generation and connection
 * - Wall placement
 * - Door state initialization
 * - RenderMap generation
 */
import { TILE, DEFAULT_DUNGEON_CONFIG } from '../constants';
import type { TileType, TileVariant, Room, DungeonConfig } from '../constants';
import {
  createEmptyDungeon,
  generateTileVariants,
  generateRooms,
  connectRooms,
  calculateSpatialNeighbors,
  addWalls
} from '../dungeon/generation';
import { initializeDungeonRNG, generateRandomSeed, getDecorationRng } from '../dungeon/DungeonRNG';
import type { TileTheme, RenderMap } from '../tiletheme/types';
import { generateRenderMap } from '../tiletheme/RenderMapGenerator';

export interface DungeonStructure {
  dungeon: TileType[][];
  tileVariants: TileVariant[][];
  rooms: Room[];
  roomMap: number[][];
  doorStates: Map<string, boolean>;
  renderMap: RenderMap | null;
  config: DungeonConfig;
}

export interface DungeonGenerationParams {
  structureSeed?: number;
  decorationSeed?: number;
  spawnSeed?: number;
  dungeonConfig?: Partial<DungeonConfig>;
  darkTheme: TileTheme | null;
  lightTheme: TileTheme | null;
}

/**
 * Generate a new dungeon structure
 */
export function generateDungeonStructure(params: DungeonGenerationParams): DungeonStructure {
  const { structureSeed, decorationSeed, spawnSeed, dungeonConfig, darkTheme, lightTheme } = params;

  // Merge config with defaults
  const config: DungeonConfig = {
    ...DEFAULT_DUNGEON_CONFIG,
    ...dungeonConfig
  };

  // Initialize RNG with provided seeds or generate random ones
  const finalStructureSeed = structureSeed ?? generateRandomSeed();
  const finalDecorationSeed = decorationSeed ?? generateRandomSeed();
  const finalSpawnSeed = spawnSeed ?? generateRandomSeed();

  initializeDungeonRNG(finalStructureSeed, finalDecorationSeed, finalSpawnSeed);

  // Log seeds for debugging/reproduction
  console.log(`Dungeon Seeds - Structure: ${finalStructureSeed}, Decoration: ${finalDecorationSeed}, Spawn: ${finalSpawnSeed}`);
  console.log(`Dungeon Config - Width: ${config.width}, Height: ${config.height}, Algorithm: ${config.algorithm}`);

  // Create empty dungeon and variants
  const dungeon = createEmptyDungeon(config);
  const tileVariants = generateTileVariants(config);

  // Initialize roomMap
  const roomMap: number[][] = [];
  for (let y = 0; y < config.height; y++) {
    roomMap[y] = [];
    for (let x = 0; x < config.width; x++) {
      roomMap[y][x] = -1;
    }
  }

  // Generate rooms and connections
  const rooms = generateRooms(dungeon, roomMap, config);
  connectRooms(dungeon, roomMap, rooms, config);
  calculateSpatialNeighbors(dungeon, roomMap, rooms, config);
  addWalls(dungeon, config);

  // Initialize door states (all doors start closed)
  const doorStates = new Map<string, boolean>();
  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      if (dungeon[y][x] === TILE.DOOR) {
        doorStates.set(`${x},${y}`, false); // false = closed
      }
    }
  }

  // Generate RenderMap if theme is loaded
  let renderMap: RenderMap | null = null;
  if (darkTheme) {
    const decorRng = getDecorationRng();
    const renderSeed = decorRng.nextInt(0, 1000000);
    renderMap = generateRenderMap(dungeon, darkTheme, lightTheme, renderSeed);
    console.log(`Generated RenderMap: ${renderMap.width}x${renderMap.height}`);
  }

  return {
    dungeon,
    tileVariants,
    rooms,
    roomMap,
    doorStates,
    renderMap,
    config
  };
}
