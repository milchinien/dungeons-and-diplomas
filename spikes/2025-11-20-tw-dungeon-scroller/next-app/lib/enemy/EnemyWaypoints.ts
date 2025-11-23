/**
 * Enemy Waypoint Management Module
 *
 * Handles waypoint selection for wandering enemies.
 * Picks random floor tiles within the enemy's current room.
 */
import { TILE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../constants';
import type { TileType, Room } from '../constants';
import type { Enemy } from './Enemy';

/**
 * Pick a random floor tile in the enemy's room as waypoint
 */
export function pickRandomWaypoint(
  enemy: Enemy,
  rooms: Room[],
  dungeon: TileType[][],
  roomMap: number[][],
  tileSize: number
): void {
  const room = rooms[enemy.roomId];
  if (!room) return;

  const roomFloorTiles: { x: number; y: number }[] = [];
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
        if (dungeon[y][x] === TILE.FLOOR && roomMap[y][x] === enemy.roomId) {
          roomFloorTiles.push({ x: x * tileSize, y: y * tileSize });
        }
      }
    }
  }

  if (roomFloorTiles.length > 0) {
    enemy.waypoint = roomFloorTiles[Math.floor(Math.random() * roomFloorTiles.length)];
  }
}
