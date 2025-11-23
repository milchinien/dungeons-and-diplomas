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
  private lastSpacePressed: boolean = false;

  public checkCollision(
    x: number,
    y: number,
    tileSize: number,
    dungeon: TileType[][]
  ): boolean {
    return CollisionDetector.checkCollision(x, y, tileSize, dungeon);
  }

  public checkPlayerCollision(
    x: number,
    y: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): boolean {
    return CollisionDetector.checkPlayerCollision(x, y, tileSize, dungeon, doorStates);
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

  /**
   * Find adjacent door to player (within 1 tile in facing direction or any adjacent)
   */
  private findAdjacentDoor(
    player: Player,
    tileSize: number,
    dungeon: TileType[][]
  ): { x: number; y: number } | null {
    const pTileX = Math.floor((player.x + tileSize / 2) / tileSize);
    const pTileY = Math.floor((player.y + tileSize / 2) / tileSize);

    // Check all 4 adjacent tiles
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 }   // right
    ];

    for (const { dx, dy } of directions) {
      const nx = pTileX + dx;
      const ny = pTileY + dy;

      if (nx >= 0 && nx < DUNGEON_WIDTH && ny >= 0 && ny < DUNGEON_HEIGHT) {
        if (dungeon[ny][nx] === TILE.DOOR) {
          return { x: nx, y: ny };
        }
      }
    }

    return null;
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
    doorStates: Map<string, boolean>,
    treasures?: Set<string>,
    onTreasureCollected?: (x: number, y: number) => void
  ) {
    if (inCombat) return;

    // Handle space key for door toggle (only on key press, not hold)
    const spacePressed = keys[' '];
    if (spacePressed && !this.lastSpacePressed) {
      const adjacentDoor = this.findAdjacentDoor(player, tileSize, dungeon);
      if (adjacentDoor) {
        const doorKey = `${adjacentDoor.x},${adjacentDoor.y}`;
        const isOpen = doorStates.get(doorKey) ?? false;
        doorStates.set(doorKey, !isOpen);
      }
    }
    this.lastSpacePressed = spacePressed;

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

      // Use player collision that respects door states
      if (!this.checkPlayerCollision(newX, player.y, tileSize, dungeon, doorStates)) {
        player.x = newX;
      }
      if (!this.checkPlayerCollision(player.x, newY, tileSize, dungeon, doorStates)) {
        player.y = newY;
      }

      player.direction = DirectionCalculator.calculateDirection(dx, dy);

      playerSprite?.playAnimation(player.direction, ANIMATION.RUN);
      this.updateFogOfWar(player, tileSize, roomMap, rooms);

      // Check for treasure collection
      const pTileX = Math.floor((player.x + tileSize / 2) / tileSize);
      const pTileY = Math.floor((player.y + tileSize / 2) / tileSize);

      if (pTileX >= 0 && pTileX < DUNGEON_WIDTH && pTileY >= 0 && pTileY < DUNGEON_HEIGHT) {
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
