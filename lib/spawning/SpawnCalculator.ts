/**
 * Spawn Calculator for Enemy Placement
 *
 * Pure function to calculate enemy spawn configurations based on
 * room types, player ELO, and subject distribution.
 */

import type { SeededRandom } from '../dungeon/SeededRandom';
import { generateNormalRoomLevel, generateCombatRoomLevel } from './LevelDistribution';
import { selectWeightedSubject } from './SubjectWeighting';

/**
 * Configuration for a single enemy spawn
 */
export interface EnemySpawnConfig {
  tileX: number;
  tileY: number;
  roomIndex: number;
  level: number;
  subject: string;
  playerElo: number;
}

/**
 * Input parameters for enemy spawn calculation
 */
export interface SpawnCalculationInput {
  rooms: Array<{ x: number; y: number; width: number; height: number; type: string }>;
  dungeon: number[][];
  roomMap: number[][];
  dungeonWidth: number;
  dungeonHeight: number;
  playerRoomId: number;
  subjectWeights: { [key: string]: number };
  subjectElos: { [key: string]: number };
  tileFloorValue: number;
  spawnRng: SeededRandom;
}

/**
 * Collect all floor tiles within a room
 */
function collectRoomFloorTiles(
  room: { x: number; y: number; width: number; height: number },
  roomIndex: number,
  dungeon: number[][],
  roomMap: number[][],
  dungeonWidth: number,
  dungeonHeight: number,
  tileFloorValue: number
): { x: number; y: number }[] {
  const floorTiles: { x: number; y: number }[] = [];

  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (y >= 0 && y < dungeonHeight && x >= 0 && x < dungeonWidth) {
        if (dungeon[y][x] === tileFloorValue && roomMap[y][x] === roomIndex) {
          floorTiles.push({ x, y });
        }
      }
    }
  }

  return floorTiles;
}

/**
 * Determine enemy count and level generation strategy for a room
 */
function getRoomSpawnStrategy(
  roomType: string,
  spawnRng: SeededRandom,
  subjectElos: { [key: string]: number }
): {
  enemyCount: number;
  levelGenerator: (index: number, subject: string) => number;
} {
  switch (roomType) {
    case 'treasure':
      // Treasure rooms: No enemies
      return {
        enemyCount: 0,
        levelGenerator: () => 1
      };

    case 'combat':
      // Combat rooms: 1-3 enemies, at least one level 8+
      return {
        enemyCount: spawnRng.nextInt(1, 4),
        levelGenerator: (index: number) => {
          // First enemy is guaranteed level 8+
          return generateCombatRoomLevel(index === 0, spawnRng);
        }
      };

    case 'empty':
    default:
      // Normal rooms: 1 enemy, level 1-6 based on player ELO
      return {
        enemyCount: 1,
        levelGenerator: (_index: number, subject: string) => {
          const playerElo = subjectElos[subject] || 5;
          return generateNormalRoomLevel(playerElo, spawnRng);
        }
      };
  }
}

/**
 * Pure function to calculate enemy spawn configurations
 *
 * This function determines WHERE enemies spawn and WHAT stats they have,
 * without actually creating Enemy objects or loading sprites.
 *
 * @param input All data needed to calculate spawns
 * @returns Array of spawn configurations
 */
export function calculateEnemySpawns(input: SpawnCalculationInput): EnemySpawnConfig[] {
  const {
    rooms,
    dungeon,
    roomMap,
    dungeonWidth,
    dungeonHeight,
    playerRoomId,
    subjectWeights,
    subjectElos,
    tileFloorValue,
    spawnRng
  } = input;

  const spawns: EnemySpawnConfig[] = [];

  for (let i = 0; i < rooms.length; i++) {
    // Skip player's starting room
    if (i === playerRoomId) {
      continue;
    }

    const room = rooms[i];

    // Collect floor tiles in this room
    const roomFloorTiles = collectRoomFloorTiles(
      room,
      i,
      dungeon,
      roomMap,
      dungeonWidth,
      dungeonHeight,
      tileFloorValue
    );

    if (roomFloorTiles.length === 0) continue;

    // Get spawn strategy for this room type
    const { enemyCount, levelGenerator } = getRoomSpawnStrategy(
      room.type,
      spawnRng,
      subjectElos
    );

    // Generate spawn configurations
    for (let enemyIndex = 0; enemyIndex < enemyCount; enemyIndex++) {
      // Select random spawn position
      const spawnPos = roomFloorTiles[spawnRng.nextIntMax(roomFloorTiles.length)];

      // Select subject (weighted by inverse ELO)
      const subject = selectWeightedSubject(subjectWeights, spawnRng);

      // Generate level based on room type
      const level = levelGenerator(enemyIndex, subject);

      spawns.push({
        tileX: spawnPos.x,
        tileY: spawnPos.y,
        roomIndex: i,
        level,
        subject,
        playerElo: subjectElos[subject] || 5
      });
    }
  }

  return spawns;
}
