/**
 * Tile Coordinate Utilities
 *
 * Centralized functions for converting between world coordinates and tile positions.
 * Eliminates duplicate Math.floor((coord + tileSize / 2) / tileSize) calculations.
 */

/**
 * Convert world coordinates to tile position
 * @param worldX - X position in world/pixel coordinates
 * @param worldY - Y position in world/pixel coordinates
 * @param tileSize - Size of a tile in pixels
 * @returns Object with tile x (tx) and tile y (ty) coordinates
 */
export function getTilePosition(
  worldX: number,
  worldY: number,
  tileSize: number
): { tx: number; ty: number } {
  return {
    tx: Math.floor((worldX + tileSize / 2) / tileSize),
    ty: Math.floor((worldY + tileSize / 2) / tileSize)
  };
}

/**
 * Convert a single world coordinate to tile coordinate
 * @param worldCoord - Position in world/pixel coordinates
 * @param tileSize - Size of a tile in pixels
 * @returns Tile coordinate
 */
export function worldToTile(worldCoord: number, tileSize: number): number {
  return Math.floor((worldCoord + tileSize / 2) / tileSize);
}

/**
 * Convert tile coordinates to world coordinates (top-left corner of tile)
 * @param tileX - Tile X coordinate
 * @param tileY - Tile Y coordinate
 * @param tileSize - Size of a tile in pixels
 * @returns Object with world x and y coordinates
 */
export function tileToWorld(
  tileX: number,
  tileY: number,
  tileSize: number
): { x: number; y: number } {
  return {
    x: tileX * tileSize,
    y: tileY * tileSize
  };
}

/**
 * Get tile position for an entity (uses entity center)
 * @param entity - Object with x and y properties
 * @param tileSize - Size of a tile in pixels
 * @returns Object with tile x (tx) and tile y (ty) coordinates
 */
export function getEntityTilePosition(
  entity: { x: number; y: number },
  tileSize: number
): { tx: number; ty: number } {
  return getTilePosition(entity.x, entity.y, tileSize);
}
