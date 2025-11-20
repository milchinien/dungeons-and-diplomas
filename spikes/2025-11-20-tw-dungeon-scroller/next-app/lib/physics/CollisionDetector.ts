import { DUNGEON_WIDTH, DUNGEON_HEIGHT, TILE, PLAYER_SIZE } from '../constants';
import type { TileType } from '../constants';

/**
 * Collision detection utility for game entities
 *
 * Uses a reduced hitbox (PLAYER_SIZE multiplier) and checks all 4 corners
 * against the dungeon grid to determine if a position is valid.
 */
export class CollisionDetector {
  /**
   * Check if an entity at the given position would collide with walls or empty tiles
   *
   * @param x X position in pixels
   * @param y Y position in pixels
   * @param tileSize Size of each tile in pixels
   * @param dungeon 2D array of tile types
   * @param entitySizeMultiplier Size multiplier for hitbox (default: PLAYER_SIZE)
   * @returns true if collision detected, false otherwise
   */
  static checkCollision(
    x: number,
    y: number,
    tileSize: number,
    dungeon: TileType[][],
    entitySizeMultiplier: number = PLAYER_SIZE
  ): boolean {
    // Calculate reduced hitbox size
    const entitySize = tileSize * entitySizeMultiplier;
    const margin = (tileSize - entitySize) / 2;

    // Calculate hitbox bounds
    const left = x + margin;
    const right = x + tileSize - margin;
    const top = y + margin;
    const bottom = y + tileSize - margin;

    // Check all 4 corners of the hitbox
    const points = [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom }
    ];

    for (const p of points) {
      const tileX = Math.floor(p.x / tileSize);
      const tileY = Math.floor(p.y / tileSize);

      // Check bounds
      if (tileX < 0 || tileX >= DUNGEON_WIDTH || tileY < 0 || tileY >= DUNGEON_HEIGHT) {
        return true;
      }

      // Check tile type (walls and empty tiles block movement)
      if (dungeon[tileY][tileX] === TILE.WALL || dungeon[tileY][tileX] === TILE.EMPTY) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check collision for enemies (includes doors as obstacles)
   *
   * @param x X position in pixels
   * @param y Y position in pixels
   * @param tileSize Size of each tile in pixels
   * @param dungeon 2D array of tile types
   * @param entitySizeMultiplier Size multiplier for hitbox (default: PLAYER_SIZE)
   * @returns true if collision detected, false otherwise
   */
  static checkEnemyCollision(
    x: number,
    y: number,
    tileSize: number,
    dungeon: TileType[][],
    entitySizeMultiplier: number = PLAYER_SIZE
  ): boolean {
    // Calculate reduced hitbox size
    const entitySize = tileSize * entitySizeMultiplier;
    const margin = (tileSize - entitySize) / 2;

    // Calculate hitbox bounds
    const left = x + margin;
    const right = x + tileSize - margin;
    const top = y + margin;
    const bottom = y + tileSize - margin;

    // Check all 4 corners of the hitbox
    const points = [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom }
    ];

    for (const p of points) {
      const tileX = Math.floor(p.x / tileSize);
      const tileY = Math.floor(p.y / tileSize);

      // Check bounds
      if (tileX < 0 || tileX >= DUNGEON_WIDTH || tileY < 0 || tileY >= DUNGEON_HEIGHT) {
        return true;
      }

      // Check tile type (walls, empty tiles, and DOORS block enemies)
      if (dungeon[tileY][tileX] === TILE.WALL ||
          dungeon[tileY][tileX] === TILE.EMPTY ||
          dungeon[tileY][tileX] === TILE.DOOR) {
        return true;
      }
    }

    return false;
  }
}
