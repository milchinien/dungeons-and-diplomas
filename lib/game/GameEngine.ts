import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE,
  ANIMATION,
  PLAYER_SPEED_TILES,
  DIRECTION_OFFSETS
} from '../constants';
import type { TileType, Room } from '../constants';
import type { Player } from '../enemy';
import { Enemy } from '../enemy';
import { CollisionDetector } from '../physics/CollisionDetector';
import { getEntityTilePosition } from '../physics/TileCoordinates';
import { DirectionCalculator } from '../movement/DirectionCalculator';
import type { UpdatePlayerContext, UpdateEnemiesContext } from '../types/game';

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
    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);

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
    const { tx: pTileX, ty: pTileY } = getEntityTilePosition(player, tileSize);

    // Check all 4 adjacent tiles
    for (const { dx, dy } of DIRECTION_OFFSETS) {
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

  /**
   * Check if an entity is on a specific tile
   */
  private isEntityOnTile(entityX: number, entityY: number, tileX: number, tileY: number, tileSize: number): boolean {
    const { tx: entityTileX, ty: entityTileY } = getEntityTilePosition({ x: entityX, y: entityY }, tileSize);
    return entityTileX === tileX && entityTileY === tileY;
  }

  /**
   * Find a free adjacent tile to push entity to
   */
  private findFreeTile(
    fromTileX: number,
    fromTileY: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): { x: number; y: number } | null {
    for (const { dx, dy } of DIRECTION_OFFSETS) {
      const nx = fromTileX + dx;
      const ny = fromTileY + dy;

      if (nx >= 0 && nx < DUNGEON_WIDTH && ny >= 0 && ny < DUNGEON_HEIGHT) {
        const tile = dungeon[ny][nx];
        // Floor is always free
        if (tile === TILE.FLOOR) {
          return { x: nx * tileSize, y: ny * tileSize };
        }
        // Open door is also free
        if (tile === TILE.DOOR) {
          const isOpen = doorStates.get(`${nx},${ny}`) ?? false;
          if (isOpen) {
            return { x: nx * tileSize, y: ny * tileSize };
          }
        }
      }
    }

    return null;
  }

  /**
   * Push entity away from a closed door
   */
  private pushEntityFromDoor(
    entity: { x: number; y: number },
    doorTileX: number,
    doorTileY: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    if (this.isEntityOnTile(entity.x, entity.y, doorTileX, doorTileY, tileSize)) {
      const freeTile = this.findFreeTile(doorTileX, doorTileY, tileSize, dungeon, doorStates);
      if (freeTile) {
        entity.x = freeTile.x;
        entity.y = freeTile.y;
      }
    }
  }

  public updatePlayer(ctx: UpdatePlayerContext) {
    const {
      dt,
      player,
      keys,
      tileSize,
      dungeon,
      roomMap,
      rooms,
      playerSprite,
      inCombat,
      doorStates,
      enemies,
      treasures,
      onTreasureCollected
    } = ctx;

    if (inCombat) return;

    // Handle space key for door toggle (only on key press, not hold)
    const spacePressed = keys[' '];
    if (spacePressed && !this.lastSpacePressed) {
      const adjacentDoor = this.findAdjacentDoor(player, tileSize, dungeon);
      if (adjacentDoor) {
        const doorKey = `${adjacentDoor.x},${adjacentDoor.y}`;
        const isOpen = doorStates.get(doorKey) ?? false;
        doorStates.set(doorKey, !isOpen);

        // If we just CLOSED the door, push entities away
        if (isOpen) { // was open, now closed
          // Push player if on the door tile
          this.pushEntityFromDoor(player, adjacentDoor.x, adjacentDoor.y, tileSize, dungeon, doorStates);

          // Push all enemies if on the door tile
          for (const enemy of enemies) {
            if (enemy.alive) {
              this.pushEntityFromDoor(enemy, adjacentDoor.x, adjacentDoor.y, tileSize, dungeon, doorStates);
            }
          }
        }
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
      const { tx: pTileX, ty: pTileY } = getEntityTilePosition(player, tileSize);

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

  public updateEnemies(ctx: UpdateEnemiesContext) {
    const {
      dt,
      enemies,
      player,
      tileSize,
      rooms,
      dungeon,
      roomMap,
      startCombat,
      inCombat,
      doorStates
    } = ctx;

    for (const enemy of enemies) {
      enemy.update(
        dt,
        player,
        tileSize,
        rooms,
        dungeon,
        roomMap,
        startCombat,
        inCombat,
        doorStates
      );
    }
  }
}
