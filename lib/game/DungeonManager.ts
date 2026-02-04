/**
 * Dungeon Manager
 *
 * Coordinates dungeon state and orchestrates initialization.
 * Delegates to specialized modules:
 * - DungeonInitializer: Structure generation
 * - EntitySpawner: Player/Enemy/Treasure/Shrine spawning
 * - ThemeLoader: Theme loading (lib/tiletheme)
 */
import {
  DIRECTION,
  ANIMATION,
  DEFAULT_DUNGEON_CONFIG
} from '../constants';
import type { TileType, TileVariant, Room, DungeonConfig, Shrine } from '../constants';
import type { Player } from '../enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy, Trashmob } from '../enemy';
import type { TileTheme, ImportedTileset, RenderMap } from '../tiletheme/types';
import { ThemeLoader } from '../tiletheme/ThemeLoader';
import { generateDungeonStructure } from './DungeonInitializer';
import { spawnPlayer, spawnEnemies, spawnTreasures, createShrines, spawnTrashmobs } from './EntitySpawner';
import type { DroppedItem } from '../items/types';
import { initializeShopDoorStates } from '../shop/ShopDoor';
import { generateDungeonFromLayouts } from '../dungeon/layoutGeneration';
import { getLayoutPool } from '../roomlayouts/LayoutPool';
import { generateRenderMap } from '../tiletheme/RenderMapGenerator';

export class DungeonManager {
  // Dungeon structure
  public dungeon: TileType[][] = [];
  public tileVariants: TileVariant[][] = [];
  public rooms: Room[] = [];
  public roomMap: number[][] = [];
  public doorStates: Map<string, boolean> = new Map();
  public config: DungeonConfig = { ...DEFAULT_DUNGEON_CONFIG };

  // Entities
  public player: Player;
  public enemies: Enemy[] = [];
  public trashmobs: Trashmob[] = [];
  public playerSprite: SpriteSheetLoader | null = null;
  public treasures: Set<string> = new Set();
  public droppedItems: DroppedItem[] = [];
  public shrines: Shrine[] = [];

  // Rendering
  public tileSize: number = 64;
  public darkTheme: TileTheme | null = null;
  public lightTheme: TileTheme | null = null;
  public tilesets: ImportedTileset[] = [];
  public renderMap: RenderMap | null = null;

  constructor(player: Player) {
    this.player = player;
  }

  get dungeonWidth(): number {
    return this.config.width;
  }

  get dungeonHeight(): number {
    return this.config.height;
  }

  /**
   * Initialize the dungeon manager (load sprites, theme, generate dungeon)
   */
  async initialize(
    availableSubjects: string[],
    onLoadingProgress?: (progress: number, statusText: string) => void
  ) {
    // Load player sprite and theme in parallel
    const [playerSprite] = await Promise.all([
      (async () => {
        const sprite = new SpriteSheetLoader('player');
        await sprite.load();
        sprite.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
        return sprite;
      })(),
      this.loadTheme(1)
    ]);

    this.playerSprite = playerSprite;

    // Generate initial dungeon using pre-generated room layouts
    await this.generateFromLayouts(availableSubjects);
  }

  /**
   * Load a tile theme and its tilesets using ThemeLoader
   */
  async loadTheme(themeId: number): Promise<boolean> {
    const result = await ThemeLoader.loadTheme(themeId);

    if (!result) {
      console.warn(`Failed to load theme ${themeId}, using fallback rendering`);
      return false;
    }

    this.darkTheme = result.theme;
    this.tilesets = result.tilesets;
    return true;
  }

  /**
   * Generate a new dungeon with all entities
   */
  async generateNewDungeon(
    availableSubjects: string[],
    userId: number | null = null,
    structureSeed?: number,
    decorationSeed?: number,
    spawnSeed?: number,
    dungeonConfig?: Partial<DungeonConfig>
  ) {
    // Generate dungeon structure using DungeonInitializer
    const structure = generateDungeonStructure({
      structureSeed,
      decorationSeed,
      spawnSeed,
      dungeonConfig,
      darkTheme: this.darkTheme,
      lightTheme: this.lightTheme
    });

    // Apply structure to manager state
    this.dungeon = structure.dungeon;
    this.tileVariants = structure.tileVariants;
    this.rooms = structure.rooms;
    this.roomMap = structure.roomMap;
    this.doorStates = structure.doorStates;
    this.renderMap = structure.renderMap;
    this.config = structure.config;

    // Create spawn context for entity spawning
    const spawnContext = {
      dungeon: this.dungeon,
      rooms: this.rooms,
      roomMap: this.roomMap,
      dungeonWidth: this.dungeonWidth,
      dungeonHeight: this.dungeonHeight,
      tileSize: this.tileSize
    };

    // Spawn entities using EntitySpawner
    spawnPlayer(this.player, spawnContext);
    this.enemies = await spawnEnemies(spawnContext, availableSubjects, userId, this.player);
    this.treasures = spawnTreasures(spawnContext);
    this.shrines = createShrines(spawnContext);
    this.trashmobs = spawnTrashmobs(spawnContext, this.player);
    
    // Initialize shop door states based on enemy positions
    initializeShopDoorStates(this.rooms, this.enemies);
  }

  /**
   * Generate a new dungeon using room layouts instead of BSP
   * Alternative to generateNewDungeon() that uses pre-generated room layouts
   */
  async generateFromLayouts(
    availableSubjects: string[],
    userId: number | null = null,
    targetRoomCount: number = 20,
    seed?: number
  ) {
    // Fetch layouts from API and populate the pool
    const pool = getLayoutPool();
    const response = await fetch('/api/room-layouts');
    if (response.ok) {
      const layouts = await response.json();
      pool.setLayouts(layouts);
    } else {
      throw new Error('Failed to load room layouts from API');
    }

    // Generate dungeon structure from layouts
    const structure = generateDungeonFromLayouts(targetRoomCount, seed);

    // Apply structure to manager state
    this.dungeon = structure.dungeon;
    this.rooms = structure.rooms;
    this.roomMap = structure.roomMap;

    // Initialize tile variants (needed for legacy rendering path)
    this.tileVariants = Array(this.dungeonHeight).fill(null).map(() =>
      Array(this.dungeonWidth).fill(null).map(() => ({
        floor: { x: 0, y: 0 },
        wall: { x: 0, y: 0 }
      }))
    );

    // Initialize door states — connected door pairs (adjacent DOOR tiles from
    // layout-based generation) start open so rooms are reachable; isolated doors
    // start closed as in BSP-generated dungeons.
    this.doorStates = new Map();
    for (let y = 0; y < this.dungeonHeight; y++) {
      for (let x = 0; x < this.dungeonWidth; x++) {
        if (this.dungeon[y][x] === 3) { // TILE.DOOR
          this.doorStates.set(`${x},${y}`, false);
        }
      }
    }
    // Open connected door pairs (two adjacent DOOR tiles created when layout
    // rooms connect via their edge doors)
    for (let y = 0; y < this.dungeonHeight; y++) {
      for (let x = 0; x < this.dungeonWidth; x++) {
        if (this.dungeon[y][x] === 3) {
          // Check right neighbor
          if (x + 1 < this.dungeonWidth && this.dungeon[y][x + 1] === 3) {
            this.doorStates.set(`${x},${y}`, true);
            this.doorStates.set(`${x + 1},${y}`, true);
          }
          // Check bottom neighbor
          if (y + 1 < this.dungeonHeight && this.dungeon[y + 1][x] === 3) {
            this.doorStates.set(`${x},${y}`, true);
            this.doorStates.set(`${x},${y + 1}`, true);
          }
        }
      }
    }

    // Generate RenderMap for themed rendering
    if (this.darkTheme) {
      const renderSeed = seed ?? Math.floor(Math.random() * 1000000);
      this.renderMap = generateRenderMap(this.dungeon, this.darkTheme, this.lightTheme, renderSeed);
    }

    // Create spawn context for entity spawning
    const spawnContext = {
      dungeon: this.dungeon,
      rooms: this.rooms,
      roomMap: this.roomMap,
      dungeonWidth: this.dungeonWidth,
      dungeonHeight: this.dungeonHeight,
      tileSize: this.tileSize
    };

    // Spawn entities using EntitySpawner
    spawnPlayer(this.player, spawnContext);
    this.enemies = await spawnEnemies(spawnContext, availableSubjects, userId, this.player);
    this.treasures = spawnTreasures(spawnContext);
    this.shrines = createShrines(spawnContext);
    this.trashmobs = spawnTrashmobs(spawnContext, this.player);

    // Initialize shop door states based on enemy positions
    initializeShopDoorStates(this.rooms, this.enemies);
  }

  /**
   * Get dungeon data for testing purposes
   */
  getDungeonData() {
    return {
      dungeon: this.dungeon,
      rooms: this.rooms,
      roomMap: this.roomMap,
      width: this.dungeonWidth,
      height: this.dungeonHeight,
      doorStates: this.doorStates,
      enemies: this.enemies,
      trashmobs: this.trashmobs,
      treasures: this.treasures,
      shrines: this.shrines,
      player: this.player
    };
  }
}
