/**
 * Dungeon Manager
 *
 * Coordinates dungeon state and orchestrates initialization.
 * Delegates to specialized modules:
 * - DungeonInitializer: Structure generation
 * - EntitySpawner: Player/Enemy/Treasure spawning
 * - ThemeLoader: Theme loading (lib/tiletheme)
 */
import {
  DIRECTION,
  ANIMATION,
  DEFAULT_DUNGEON_CONFIG
} from '../constants';
import type { TileType, TileVariant, Room, DungeonConfig } from '../constants';
import type { Player } from '../enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy } from '../enemy';
import type { TileTheme, ImportedTileset, RenderMap } from '../tiletheme/types';
import { ThemeLoader } from '../tiletheme/ThemeLoader';
import { generateDungeonStructure } from './DungeonInitializer';
import { spawnPlayer, spawnEnemies, spawnTreasures } from './EntitySpawner';

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
  public playerSprite: SpriteSheetLoader | null = null;
  public treasures: Set<string> = new Set();

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
  async initialize(availableSubjects: string[]) {
    // Load player sprite
    const playerSprite = new SpriteSheetLoader('player');
    await playerSprite.load();
    playerSprite.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
    this.playerSprite = playerSprite;

    // Load theme (default to Theme 1)
    await this.loadTheme(1);

    // Generate initial dungeon
    await this.generateNewDungeon(availableSubjects);
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
  }
}
