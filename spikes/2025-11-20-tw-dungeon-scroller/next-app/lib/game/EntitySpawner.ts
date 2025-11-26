/**
 * Entity Spawner Module
 *
 * Handles spawning of all game entities:
 * - Player spawn point selection
 * - Enemy spawning with ELO-based distribution
 * - Treasure placement in treasure rooms
 */
import { TILE, PLAYER_MAX_HP } from '../constants';
import type { TileType, Room } from '../constants';
import type { Player } from '../enemy';
import { Enemy } from '../enemy';
import { getSpawnRng } from '../dungeon/DungeonRNG';
import {
  calculateSubjectWeights,
  calculateEnemySpawns
} from '../spawning/LevelDistribution';
import { api } from '../api';
import { ENEMY_TYPES } from '../spriteConfig';

export interface SpawnContext {
  dungeon: TileType[][];
  rooms: Room[];
  roomMap: number[][];
  dungeonWidth: number;
  dungeonHeight: number;
  tileSize: number;
}

/**
 * Spawn player at a random floor tile and set initial room visibility
 */
export function spawnPlayer(
  player: Player,
  context: SpawnContext
): void {
  const { dungeon, rooms, roomMap, dungeonWidth, dungeonHeight, tileSize } = context;

  const validSpawnPoints: { x: number; y: number }[] = [];

  for (let y = 0; y < dungeonHeight; y++) {
    for (let x = 0; x < dungeonWidth; x++) {
      if (dungeon[y][x] === TILE.FLOOR) {
        validSpawnPoints.push({ x, y });
      }
    }
  }

  if (validSpawnPoints.length > 0) {
    const rng = getSpawnRng();
    const spawnPoint = validSpawnPoints[rng.nextIntMax(validSpawnPoints.length)];
    player.x = spawnPoint.x * tileSize;
    player.y = spawnPoint.y * tileSize;

    // Make all rooms invisible first
    for (const room of rooms) {
      room.visible = false;
    }

    // Then make only the player's starting room visible
    const roomId = roomMap[spawnPoint.y][spawnPoint.x];
    if (roomId >= 0 && rooms[roomId]) {
      rooms[roomId].visible = true;
    }
  }

  // Reset player HP
  player.hp = PLAYER_MAX_HP;
}

/**
 * Spawn treasures in treasure rooms
 */
export function spawnTreasures(
  context: SpawnContext
): Set<string> {
  const { dungeon, rooms, roomMap, dungeonWidth, dungeonHeight } = context;
  const treasures = new Set<string>();

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];

    if (room.type !== 'treasure') continue;

    // Collect floor tiles in this room
    const roomFloorTiles: { x: number; y: number }[] = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < dungeonHeight && x >= 0 && x < dungeonWidth) {
          if (dungeon[y][x] === TILE.FLOOR && roomMap[y][x] === i) {
            roomFloorTiles.push({ x, y });
          }
        }
      }
    }

    if (roomFloorTiles.length === 0) continue;

    // Pick random position in room for treasure
    const rng = getSpawnRng();
    const treasurePos = roomFloorTiles[rng.nextIntMax(roomFloorTiles.length)];
    treasures.add(`${treasurePos.x},${treasurePos.y}`);
  }

  return treasures;
}

/**
 * Spawn enemies with ELO-based subject weighting
 */
export async function spawnEnemies(
  context: SpawnContext,
  availableSubjects: string[],
  userId: number | null,
  player: Player
): Promise<Enemy[]> {
  const { dungeon, rooms, roomMap, dungeonWidth, dungeonHeight, tileSize } = context;
  const enemies: Enemy[] = [];

  // Get player's current room
  const playerTileX = Math.floor((player.x + tileSize / 2) / tileSize);
  const playerTileY = Math.floor((player.y + tileSize / 2) / tileSize);
  const playerRoomId = roomMap[playerTileY]?.[playerTileX] ?? -1;

  // Load user ELO data for subject weighting and level distribution
  let subjectElos: { [key: string]: number } = {};
  let subjectWeights: { [key: string]: number } = {};

  if (userId) {
    try {
      const eloData = await api.elo.getSessionElo(userId);

      // Build ELO map
      for (const entry of eloData) {
        subjectElos[entry.subjectKey] = entry.averageElo;
      }

      // Calculate subject weights (inverse ELO - weak subjects get more enemies)
      subjectWeights = calculateSubjectWeights(subjectElos);
    } catch (error) {
      console.error('Failed to load user ELO data, using fallback spawning:', error);
    }
  }

  // Fallback to equal distribution if no ELO data
  if (Object.keys(subjectWeights).length === 0) {
    for (const subject of availableSubjects) {
      subjectWeights[subject] = 1.0 / availableSubjects.length;
      subjectElos[subject] = 5; // Default medium ELO
    }
  }

  // Calculate spawn configurations using pure function
  const spawnConfigs = calculateEnemySpawns({
    rooms,
    dungeon,
    roomMap,
    dungeonWidth,
    dungeonHeight,
    playerRoomId,
    subjectWeights,
    subjectElos,
    tileFloorValue: TILE.FLOOR,
    spawnRng: getSpawnRng()
  });

  // Create Enemy instances from spawn configurations
  for (const config of spawnConfigs) {
    const enemy = new Enemy(
      config.tileX * tileSize,
      config.tileY * tileSize,
      ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)],
      config.roomIndex,
      config.level,
      config.subject
    );

    // Set player ELO for this subject (for dynamic aggro radius)
    enemy.playerElo = config.playerElo;

    await enemy.load();
    enemies.push(enemy);
  }

  return enemies;
}
