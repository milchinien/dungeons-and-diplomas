import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE,
  ANIMATION,
  PLAYER_SPEED_TILES
} from '../constants';
import type { TileType, Room, KeyboardState } from '../constants';
import type { Player } from '../Enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy } from '../Enemy';
import { CollisionDetector } from '../physics/CollisionDetector';
import { DirectionCalculator } from '../movement/DirectionCalculator';

export class GameEngine {
  public checkCollision(
    x: number,
    y: number,
    tileSize: number,
    dungeon: TileType[][]
  ): boolean {
    return CollisionDetector.checkCollision(x, y, tileSize, dungeon);
  }

  public updateFogOfWar(
    player: Player,
    tileSize: number,
    roomMap: number[][],
    rooms: Room[]
  ) {
    const playerTileX = Math.floor((player.x + tileSize / 2) / tileSize);
    const playerTileY = Math.floor((player.y + tileSize / 2) / tileSize);

    if (playerTileX >= 0 && playerTileX < DUNGEON_WIDTH && playerTileY >= 0 && playerTileY < DUNGEON_HEIGHT) {
      const roomId = roomMap[playerTileY][playerTileX];
      if (roomId >= 0 && rooms[roomId] && !rooms[roomId].visible) {
        rooms[roomId].visible = true;
      }
    }
  }

  public updatePlayer(
    dt: number,
    player: Player,
    keys: KeyboardState,
    tileSize: number,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    playerSprite: SpriteSheetLoader | null,
    inCombat: boolean,
    treasures?: Set<string>,
    onTreasureCollected?: (x: number, y: number) => void
  ) {
    if (inCombat) return;

    let dx = 0;
    let dy = 0;

    if (keys.ArrowUp || keys.w) dy -= 1;
    if (keys.ArrowDown || keys.s) dy += 1;
    if (keys.ArrowLeft || keys.a) dx -= 1;
    if (keys.ArrowRight || keys.d) dx += 1;

    player.isMoving = (dx !== 0 || dy !== 0);

    if (player.isMoving) {
      const length = Math.sqrt(dx * dx + dy * dy);
      const currentSpeed = PLAYER_SPEED_TILES * tileSize;
      dx = dx / length * currentSpeed * dt;
      dy = dy / length * currentSpeed * dt;

      const newX = player.x + dx;
      const newY = player.y + dy;

      if (!this.checkCollision(newX, player.y, tileSize, dungeon)) {
        player.x = newX;
      }
      if (!this.checkCollision(player.x, newY, tileSize, dungeon)) {
        player.y = newY;
      }

      player.direction = DirectionCalculator.calculateDirection(dx, dy);

      playerSprite?.playAnimation(player.direction, ANIMATION.RUN);
      this.updateFogOfWar(player, tileSize, roomMap, rooms);

      // Open doors
      const pTileX = Math.floor((player.x + tileSize / 2) / tileSize);
      const pTileY = Math.floor((player.y + tileSize / 2) / tileSize);

      if (pTileX >= 0 && pTileX < DUNGEON_WIDTH && pTileY >= 0 && pTileY < DUNGEON_HEIGHT) {
        if (dungeon[pTileY][pTileX] === TILE.DOOR) {
          dungeon[pTileY][pTileX] = TILE.FLOOR;
        }

        // Check for treasure collection
        if (treasures && onTreasureCollected) {
          const treasureKey = `${pTileX},${pTileY}`;
          if (treasures.has(treasureKey)) {
            treasures.delete(treasureKey);
            onTreasureCollected(pTileX, pTileY);
          }
        }
      }
    } else {
      playerSprite?.playAnimation(player.direction, ANIMATION.IDLE);
    }

    playerSprite?.update(dt);
  }

  public updateEnemies(
    dt: number,
    enemies: Enemy[],
    player: Player,
    tileSize: number,
    rooms: Room[],
    dungeon: TileType[][],
    roomMap: number[][],
    startCombat: (enemy: Enemy) => void,
    inCombat: boolean
  ) {
    for (const enemy of enemies) {
      enemy.update(
        dt,
        player,
        tileSize,
        rooms,
        dungeon,
        roomMap,
        startCombat,
        inCombat
      );
    }
  }
}
