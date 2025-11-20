import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE,
  DIRECTION,
  ANIMATION,
  PLAYER_MAX_HP
} from '../constants';
import type { TileType, TileVariant, Room } from '../constants';
import type { Player } from '../Enemy';
import {
  createEmptyDungeon,
  generateTileVariants,
  generateRooms,
  connectRooms,
  addWalls
} from '../dungeon/generation';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy } from '../Enemy';
import {
  generateNormalRoomLevel,
  generateCombatRoomLevel,
  calculateSubjectWeights,
  selectWeightedSubject
} from '../spawning/LevelDistribution';

export class DungeonManager {
  public dungeon: TileType[][] = [];
  public tileVariants: TileVariant[][] = [];
  public rooms: Room[] = [];
  public roomMap: number[][] = [];
  public player: Player;
  public enemies: Enemy[] = [];
  public playerSprite: SpriteSheetLoader | null = null;
  public tileSize: number = 64;
  public treasures: Set<string> = new Set(); // Store treasure positions as "x,y" strings

  constructor(player: Player) {
    this.player = player;
  }

  async initialize(availableSubjects: string[]) {
    // Load player sprite
    const playerSprite = new SpriteSheetLoader('player');
    await playerSprite.load();
    playerSprite.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
    this.playerSprite = playerSprite;

    // Generate initial dungeon
    await this.generateNewDungeon(availableSubjects);
  }

  async generateNewDungeon(availableSubjects: string[], userId: number | null = null) {
    this.dungeon = createEmptyDungeon();
    this.tileVariants = generateTileVariants();

    // Initialize roomMap
    this.roomMap = [];
    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      this.roomMap[y] = [];
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        this.roomMap[y][x] = -1;
      }
    }

    this.rooms = generateRooms(this.dungeon, this.roomMap);
    connectRooms(this.dungeon, this.roomMap, this.rooms);
    addWalls(this.dungeon);

    this.spawnPlayer();
    await this.spawnEnemies(availableSubjects, userId);
    this.spawnTreasures();

    // Reset player HP
    this.player.hp = PLAYER_MAX_HP;
  }

  private spawnTreasures() {
    this.treasures.clear();

    // Spawn one treasure in each treasure room
    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];

      if (room.type !== 'treasure') continue;

      // Collect floor tiles in this room
      const roomFloorTiles: { x: number; y: number }[] = [];
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
            if (this.dungeon[y][x] === TILE.FLOOR && this.roomMap[y][x] === i) {
              roomFloorTiles.push({ x, y });
            }
          }
        }
      }

      if (roomFloorTiles.length === 0) continue;

      // Pick random position in room for treasure
      const treasurePos = roomFloorTiles[Math.floor(Math.random() * roomFloorTiles.length)];
      this.treasures.add(`${treasurePos.x},${treasurePos.y}`);
    }
  }

  private spawnPlayer() {
    const validSpawnPoints: { x: number; y: number }[] = [];

    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (this.dungeon[y][x] === TILE.FLOOR) {
          validSpawnPoints.push({ x, y });
        }
      }
    }

    if (validSpawnPoints.length > 0) {
      const spawnPoint = validSpawnPoints[Math.floor(Math.random() * validSpawnPoints.length)];
      this.player.x = spawnPoint.x * this.tileSize;
      this.player.y = spawnPoint.y * this.tileSize;

      // Make all rooms invisible first
      for (const room of this.rooms) {
        room.visible = false;
      }

      // Then make only the player's starting room visible
      const roomId = this.roomMap[spawnPoint.y][spawnPoint.x];
      if (roomId >= 0 && this.rooms[roomId]) {
        this.rooms[roomId].visible = true;
      }
    }
  }

  private async spawnEnemies(availableSubjects: string[], userId: number | null) {
    this.enemies = [];

    // Get player's current room
    const playerTileX = Math.floor((this.player.x + this.tileSize / 2) / this.tileSize);
    const playerTileY = Math.floor((this.player.y + this.tileSize / 2) / this.tileSize);
    const playerRoomId = this.roomMap[playerTileY]?.[playerTileX] ?? -1;

    // Load user ELO data for subject weighting and level distribution
    let subjectElos: { [key: string]: number } = {};
    let subjectWeights: { [key: string]: number } = {};

    if (userId) {
      try {
        const response = await fetch(`/api/session-elo?userId=${userId}`);
        if (response.ok) {
          const eloData: Array<{ subjectKey: string; subjectName: string; averageElo: number }> = await response.json();

          // Build ELO map
          for (const entry of eloData) {
            subjectElos[entry.subjectKey] = entry.averageElo;
          }

          // Calculate subject weights (inverse ELO - weak subjects get more enemies)
          subjectWeights = calculateSubjectWeights(subjectElos);
        }
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

    // Spawn enemies per room based on room type
    for (let i = 0; i < this.rooms.length; i++) {
      // Skip player's starting room
      if (i === playerRoomId) {
        continue;
      }

      const room = this.rooms[i];

      // Collect floor tiles in this room
      const roomFloorTiles: { x: number; y: number }[] = [];
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
            if (this.dungeon[y][x] === TILE.FLOOR && this.roomMap[y][x] === i) {
              roomFloorTiles.push({ x, y });
            }
          }
        }
      }

      if (roomFloorTiles.length === 0) continue;

      // Determine enemy count and level generation based on room type
      let enemyCount = 0;
      let levelGenerator: (index: number) => number;

      switch (room.type) {
        case 'treasure':
          // Treasure rooms: No enemies
          enemyCount = 0;
          break;

        case 'combat':
          // Combat rooms: 1-3 enemies, at least one level 8+
          enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3
          levelGenerator = (index: number) => {
            // First enemy is guaranteed level 8+
            if (index === 0) {
              return generateCombatRoomLevel(true);
            } else {
              return generateCombatRoomLevel(false);
            }
          };
          break;

        case 'empty':
        default:
          // Normal rooms: 1 enemy, level 1-6 based on player ELO
          enemyCount = 1;
          levelGenerator = () => {
            // Select subject first to get appropriate ELO
            const subject = selectWeightedSubject(subjectWeights);
            const playerElo = subjectElos[subject] || 5;
            return generateNormalRoomLevel(playerElo);
          };
          break;
      }

      // Spawn enemies
      for (let enemyIndex = 0; enemyIndex < enemyCount; enemyIndex++) {
        // Select random spawn position
        const spawnPos = roomFloorTiles[Math.floor(Math.random() * roomFloorTiles.length)];

        // Select subject (weighted by inverse ELO)
        const subject = selectWeightedSubject(subjectWeights);

        // Generate level based on room type
        const level = levelGenerator(enemyIndex);

        // Create and load enemy
        const enemy = new Enemy(
          spawnPos.x * this.tileSize,
          spawnPos.y * this.tileSize,
          'goblin',
          i,
          level,
          subject
        );

        // Set player ELO for this subject (for dynamic aggro radius)
        enemy.playerElo = subjectElos[subject] || 5;

        await enemy.load();
        this.enemies.push(enemy);
      }
    }
  }
}
