/**
 * Entity Spawner Module
 *
 * Handles spawning of all game entities:
 * - Player spawn point selection
 * - Enemy spawning with ELO-based distribution
 * - Treasure placement in treasure rooms
 * - Shrine creation in shrine rooms
 */
import {
  TILE,
  PLAYER_MAX_HP,
  AI_STATE,
  SHRINE_ENEMY_SPAWN_RADIUS,
  SHRINE_MIN_ENEMIES,
  SHRINE_MAX_ENEMIES,
  SHRINE_MIN_PLAYER_DISTANCE,
  TRASHMOB_TYPE
} from '../constants';
import type { TileType, Room, Shrine, TrashmobType } from '../constants';
import type { Player } from '../enemy';
import { Enemy } from '../enemy';
import { Trashmob } from '../enemy/Trashmob';
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
      
      // If player spawns in a shrine room, convert it to empty
      if (rooms[roomId].type === 'shrine') {
        rooms[roomId].type = 'empty';
      }
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
 * Create shrines in shrine rooms
 * Shrines are placed at the center of shrine rooms
 */
export function createShrines(
  context: SpawnContext
): Shrine[] {
  const { rooms } = context;
  const shrines: Shrine[] = [];

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];

    if (room.type !== 'shrine') continue;

    // Calculate center position of the room
    const centerX = Math.floor(room.x + room.width / 2);
    const centerY = Math.floor(room.y + room.height / 2);

    shrines.push({
      id: shrines.length,
      x: centerX,
      y: centerY,
      roomId: i,
      isActivated: false,
      isActive: false,
      spawnedEnemies: [],
      defeatedEnemies: []
    });
  }

  return shrines;
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
  const subjectElos: { [key: string]: number } = {};
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

// =============================================================================
// Shrine Enemy Spawning
// =============================================================================

/**
 * Context for spawning shrine enemies
 */
export interface ShrineSpawnContext extends SpawnContext {
  shrine: Shrine;
  playerX: number; // tile position
  playerY: number; // tile position
  availableSubjects: string[];
  playerAverageElo: number;
  roomsExplored: number;
  totalRooms: number;
}

/**
 * Calculate spawn positions around a shrine
 * Positions are distributed evenly in a circle, avoiding player and shrine
 */
function calculateShrineSpawnPositions(
  shrine: Shrine,
  playerX: number,
  playerY: number,
  enemyCount: number,
  room: Room
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const angleStep = (2 * Math.PI) / enemyCount;
  const startAngle = Math.random() * Math.PI * 2; // Random start angle

  for (let i = 0; i < enemyCount; i++) {
    let angle = startAngle + (i * angleStep);
    let attempts = 0;
    let validPosition = false;

    while (!validPosition && attempts < 8) {
      const x = shrine.x + Math.cos(angle) * SHRINE_ENEMY_SPAWN_RADIUS;
      const y = shrine.y + Math.sin(angle) * SHRINE_ENEMY_SPAWN_RADIUS;

      // Check if position is valid
      const inRoom = x >= room.x && x < room.x + room.width &&
                     y >= room.y && y < room.y + room.height;

      const dx = x - playerX;
      const dy = y - playerY;
      const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
      const notOnPlayer = distanceToPlayer >= SHRINE_MIN_PLAYER_DISTANCE;

      const dxShrine = x - shrine.x;
      const dyShrine = y - shrine.y;
      const distanceToShrine = Math.sqrt(dxShrine * dxShrine + dyShrine * dyShrine);
      const notOnShrine = distanceToShrine >= 1.0;

      if (inRoom && notOnPlayer && notOnShrine) {
        positions.push({ x: Math.floor(x), y: Math.floor(y) });
        validPosition = true;
      } else {
        angle += Math.PI / 4; // Rotate 45 degrees and try again
        attempts++;
      }
    }

    // Fallback: use center of room with offset
    if (!validPosition) {
      const fallbackX = Math.floor(room.x + room.width / 2 + (i === 0 ? -1 : 1));
      const fallbackY = Math.floor(room.y + room.height / 2);
      positions.push({ x: fallbackX, y: fallbackY });
    }
  }

  return positions;
}

/**
 * Determine enemy level for shrine combat
 * Based on player ELO, dungeon progress, and random variation
 */
function determineShrineEnemyLevel(
  playerAverageElo: number,
  roomsExplored: number,
  totalRooms: number
): number {
  // Base level from ELO (1-10 scale)
  const eloBasedLevel = Math.max(1, Math.round(playerAverageElo));

  // Progress bonus (0-2 extra levels)
  const progressBonus = Math.floor((roomsExplored / totalRooms) * 2);

  // Random variation (-1 to +1)
  const variation = Math.floor(Math.random() * 3) - 1;

  // Final level (clamped to 1-10)
  return Math.max(1, Math.min(10, eloBasedLevel + progressBonus + variation));
}

/**
 * Select subjects for shrine enemies
 * Tries to avoid duplicates when possible
 */
function selectEnemySubjects(enemyCount: number, availableSubjects: string[]): string[] {
  const subjects: string[] = [];
  const usedSubjects = new Set<string>();

  for (let i = 0; i < enemyCount; i++) {
    // Try to pick a subject not yet used
    let subject: string;
    let attempts = 0;

    do {
      subject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)];
      attempts++;
    } while (usedSubjects.has(subject) && attempts < availableSubjects.length * 2);

    subjects.push(subject);
    usedSubjects.add(subject);
  }

  return subjects;
}

/**
 * Spawn enemies around a shrine when activated
 * Returns the spawned enemies with shrine tracking
 */
export async function spawnShrineEnemies(
  context: ShrineSpawnContext
): Promise<Enemy[]> {
  const {
    rooms,
    tileSize,
    shrine,
    playerX,
    playerY,
    availableSubjects,
    playerAverageElo,
    roomsExplored,
    totalRooms
  } = context;

  const room = rooms[shrine.roomId];
  if (!room) {
    console.error('Shrine room not found:', shrine.roomId);
    return [];
  }

  // Determine number of enemies (1 or 2, 50/50 chance)
  const enemyCount = Math.random() < 0.5 ? SHRINE_MIN_ENEMIES : SHRINE_MAX_ENEMIES;
  console.log(`Spawning ${enemyCount} shrine enemies`);

  // Calculate spawn positions
  const positions = calculateShrineSpawnPositions(
    shrine,
    playerX,
    playerY,
    enemyCount,
    room
  );

  // Select subjects for each enemy
  const subjects = selectEnemySubjects(enemyCount, availableSubjects);

  // Create enemies
  const enemies: Enemy[] = [];

  for (let i = 0; i < enemyCount; i++) {
    const level = determineShrineEnemyLevel(playerAverageElo, roomsExplored, totalRooms);

    const enemy = new Enemy(
      positions[i].x * tileSize,
      positions[i].y * tileSize,
      ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)],
      shrine.roomId,
      level,
      subjects[i]
    );

    // Mark as shrine enemy
    enemy.isFromShrine = true;
    enemy.shrineId = shrine.id;

    // Set immediate aggro state - shrine enemies chase the player immediately
    enemy.aiState = AI_STATE.FOLLOWING;
    enemy.playerElo = playerAverageElo;

    // Load sprite
    await enemy.load();

    enemies.push(enemy);
  }

  return enemies;
}

/**
 * Spawn trashmobs in rooms
 * Trashmobs spawn in empty and combat rooms (not treasure rooms)
 */
export function spawnTrashmobs(
  context: SpawnContext,
  player: Player,
  minPerRoom: number = 2,
  maxPerRoom: number = 4
): Trashmob[] {
  const { dungeon, rooms, roomMap, dungeonWidth, dungeonHeight, tileSize } = context;
  const trashmobs: Trashmob[] = [];
  const rng = getSpawnRng();

  // Get player's current room to avoid spawning there
  const playerTileX = Math.floor((player.x + tileSize / 2) / tileSize);
  const playerTileY = Math.floor((player.y + tileSize / 2) / tileSize);
  const playerRoomId = roomMap[playerTileY]?.[playerTileX] ?? -1;

  // Available trashmob types
  const trashmobTypes: TrashmobType[] = [
    TRASHMOB_TYPE.RAT,
    TRASHMOB_TYPE.SLIME,
    TRASHMOB_TYPE.BAT
  ];

  console.log(`[EntitySpawner] Starting trashmob spawn. Total rooms: ${rooms.length}, playerRoomId: ${playerRoomId}`);

  for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
    const room = rooms[roomIndex];

    // Skip player's starting room
    if (roomIndex === playerRoomId) continue;

    // Skip treasure rooms (only empty and combat rooms get trashmobs)
    if (room.type === 'treasure') continue;

    // Skip shrine rooms
    if (room.type === 'shrine') continue;

    // Collect floor tiles in this room
    const roomFloorTiles: { x: number; y: number }[] = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < dungeonHeight && x >= 0 && x < dungeonWidth) {
          if (dungeon[y][x] === TILE.FLOOR && roomMap[y][x] === roomIndex) {
            roomFloorTiles.push({ x, y });
          }
        }
      }
    }

    if (roomFloorTiles.length === 0) continue;

    // Determine number of trashmobs for this room
    const numTrashmobs = minPerRoom + rng.nextIntMax(maxPerRoom - minPerRoom + 1);

    // Spawn trashmobs
    for (let i = 0; i < numTrashmobs && roomFloorTiles.length > 0; i++) {
      // Pick random position
      const posIndex = rng.nextIntMax(roomFloorTiles.length);
      const pos = roomFloorTiles[posIndex];

      // Remove position so we don't spawn multiple on same tile
      roomFloorTiles.splice(posIndex, 1);

      // Pick random trashmob type
      const trashmobType = trashmobTypes[rng.nextIntMax(trashmobTypes.length)];

      const trashmob = new Trashmob(
        pos.x * tileSize,
        pos.y * tileSize,
        trashmobType,
        roomIndex
      );

      trashmobs.push(trashmob);
    }
  }

  console.log(`[EntitySpawner] Spawned ${trashmobs.length} trashmobs`);
  return trashmobs;
}
