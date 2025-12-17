import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE,
  ANIMATION,
  PLAYER_SPEED_TILES,
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_ATTACK_DURATION,
  PLAYER_ATTACK_SLOWDOWN,
  PLAYER_ATTACK_DAMAGE,
  DIRECTION_OFFSETS
} from '../constants';
import type { TileType, Room, Shrine } from '../constants';
import type { Player } from '../enemy';
import { Enemy } from '../enemy';
import { Trashmob } from '../enemy/Trashmob';
import { CollisionDetector } from '../physics/CollisionDetector';
import { checkShrineCollision } from '../physics/ShrineCollision';
import { getEntityTilePosition } from '../physics/TileCoordinates';
import { DirectionCalculator } from '../movement/DirectionCalculator';
import { getTargetsInAttackCone, angleToDirection, type PlayerAttackState, createAttackState, canAttack } from '../combat/MeleeAttack';
import type { UpdatePlayerContext, UpdateEnemiesContext, UpdateTrashmobsContext } from '../types/game';
import { getEffectsManager } from '../effects';

export class GameEngine {
  private lastSpacePressed: boolean = false;

  // Attack state
  private attackState: PlayerAttackState = createAttackState();

  /**
   * Get current attack state (for external access)
   */
  public getAttackState(): PlayerAttackState {
    return this.attackState;
  }

  /**
   * Attempt to perform a melee attack
   * Returns array of hit trashmobs
   *
   * @param player - The player performing the attack
   * @param trashmobs - Array of potential targets
   * @param tileSize - Tile size in pixels
   * @param attackAngle - Optional attack angle in radians (toward cursor). If not provided, uses player.direction
   */
  public performAttack(
    player: Player,
    trashmobs: Trashmob[],
    tileSize: number,
    attackAngle?: number
  ): Trashmob[] {
    if (!canAttack(this.attackState)) {
      return [];
    }

    // Start attack
    this.attackState.isAttacking = true;
    this.attackState.cooldownRemaining = PLAYER_ATTACK_COOLDOWN;
    this.attackState.attackTimeRemaining = PLAYER_ATTACK_DURATION;

    // If attack angle provided, turn player to face that direction
    if (attackAngle !== undefined) {
      player.direction = angleToDirection(attackAngle);
    }

    // Use attack angle if provided, otherwise fall back to player direction
    const attackDirection = attackAngle ?? player.direction;

    // Find targets in attack cone
    const targets = getTargetsInAttackCone(
      player.x,
      player.y,
      attackDirection,
      trashmobs,
      tileSize
    );

    // Deal damage to all targets
    for (const target of targets) {
      target.takeDamage(PLAYER_ATTACK_DAMAGE);
    }

    return targets;
  }

  /**
   * Update attack cooldown and state
   */
  public updateAttackState(dt: number): void {
    if (this.attackState.cooldownRemaining > 0) {
      this.attackState.cooldownRemaining -= dt;
    }

    if (this.attackState.attackTimeRemaining > 0) {
      this.attackState.attackTimeRemaining -= dt;
      if (this.attackState.attackTimeRemaining <= 0) {
        this.attackState.isAttacking = false;
      }
    }
  }

  /**
   * Check if player is currently attacking (for slowdown)
   */
  public isPlayerAttacking(): boolean {
    return this.attackState.isAttacking;
  }

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
    doorStates: Map<string, boolean>,
    shrines?: Shrine[]
  ): boolean {
    // Check tile collision first
    if (CollisionDetector.checkPlayerCollision(x, y, tileSize, dungeon, doorStates)) {
      return true;
    }
    // Check shrine collision if shrines are provided
    if (shrines && shrines.length > 0) {
      if (checkShrineCollision(x, y, tileSize, shrines)) {
        return true;
      }
    }
    return false;
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

        // Trigger room reveal particle effect only in the newly revealed room
        const room = rooms[roomId];
        getEffectsManager().onRoomRevealed(room.x, room.y, room.width, room.height, tileSize);
      }
    }
  }

  /**
   * Update room exploration states based on player position and enemies.
   * Handles the new exploration mechanic:
   * - unexplored → exploring (when player enters)
   * - exploring → explored (when all enemies defeated)
   */
  public updateRoomState(
    player: Player,
    tileSize: number,
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    trashmobs: Trashmob[]
  ): void {
    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);

    if (playerTileX < 0 || playerTileX >= DUNGEON_WIDTH ||
        playerTileY < 0 || playerTileY >= DUNGEON_HEIGHT) {
      return;
    }

    const playerRoomId = roomMap[playerTileY][playerTileX];
    if (playerRoomId < 0 || !rooms[playerRoomId]) return;

    const room = rooms[playerRoomId];

    // Count enemies in this room
    const enemiesInRoom = this.countEnemiesInRoom(playerRoomId, enemies, trashmobs, roomMap, tileSize);

    // Handle state transitions
    if (room.state === 'unexplored') {
      // Player enters unexplored room → start exploring
      room.state = 'exploring';
      room.visible = true;

      // Trigger circular reveal effect
      getEffectsManager().onRoomEntered(room, player, tileSize);

      // If no enemies, immediately transition to explored after reveal
      if (enemiesInRoom === 0) {
        // Small delay before marking as explored (let reveal animation play)
        setTimeout(() => {
          if (room.state === 'exploring') {
            room.state = 'explored';
            getEffectsManager().onRoomCleared(room, tileSize);
          }
        }, 400); // Match reveal animation duration
      }
    } else if (room.state === 'exploring') {
      // Check if all enemies in room are defeated
      if (enemiesInRoom === 0) {
        room.state = 'explored';
        getEffectsManager().onRoomCleared(room, tileSize);
      }
    }
  }

  /**
   * Count alive enemies (both quiz enemies and trashmobs) in a specific room
   */
  private countEnemiesInRoom(
    roomId: number,
    enemies: Enemy[],
    trashmobs: Trashmob[],
    roomMap: number[][],
    tileSize: number
  ): number {
    let count = 0;

    // Count quiz enemies
    for (const enemy of enemies) {
      if (enemy.alive) {
        const { tx, ty } = getEntityTilePosition(enemy, tileSize);
        if (tx >= 0 && tx < DUNGEON_WIDTH && ty >= 0 && ty < DUNGEON_HEIGHT) {
          if (roomMap[ty][tx] === roomId) {
            count++;
          }
        }
      }
    }

    // Count trashmobs
    for (const trashmob of trashmobs) {
      if (trashmob.alive) {
        const { tx, ty } = getEntityTilePosition(trashmob, tileSize);
        if (tx >= 0 && tx < DUNGEON_WIDTH && ty >= 0 && ty < DUNGEON_HEIGHT) {
          if (roomMap[ty][tx] === roomId) {
            count++;
          }
        }
      }
    }

    return count;
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
      onTreasureCollected,
      shrines
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
      // Apply slowdown if attacking
      const speedMultiplier = this.attackState.isAttacking ? PLAYER_ATTACK_SLOWDOWN : 1.0;
      const currentSpeed = PLAYER_SPEED_TILES * tileSize * speedMultiplier;
      dx = dx / length * currentSpeed * dt;
      dy = dy / length * currentSpeed * dt;

      const newX = player.x + dx;
      const newY = player.y + dy;

      // Use player collision that respects door states and shrines
      if (!this.checkPlayerCollision(newX, player.y, tileSize, dungeon, doorStates, shrines)) {
        player.x = newX;
      }
      if (!this.checkPlayerCollision(player.x, newY, tileSize, dungeon, doorStates, shrines)) {
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

  // Track which trashmobs have dealt damage this attack (to prevent multi-hit)
  private trashmobDamageDealt: Set<Trashmob> = new Set();

  /**
   * Update trashmobs (AI and contact damage)
   */
  public updateTrashmobs(ctx: UpdateTrashmobsContext) {
    const {
      dt,
      trashmobs,
      player,
      tileSize,
      rooms,
      dungeon,
      doorStates,
      onContactDamage
    } = ctx;

    // Update each trashmob
    for (const trashmob of trashmobs) {
      if (!trashmob.alive) continue;

      const wasAttacking = trashmob.isAttacking;
      trashmob.update(dt, player, tileSize, rooms, dungeon, doorStates);

      // Reset damage tracking when attack ends
      if (wasAttacking && !trashmob.isAttacking) {
        this.trashmobDamageDealt.delete(trashmob);
      }

      // Check contact damage - only during attacks, after wind-up, and only once per attack
      if (trashmob.isAttacking && trashmob.canDealDamage && !this.trashmobDamageDealt.has(trashmob)) {
        const distance = trashmob.getDistanceToPlayer(player, tileSize);
        if (distance < 0.6) { // Contact distance
          const damage = trashmob.getContactDamage();
          onContactDamage(damage);
          this.trashmobDamageDealt.add(trashmob);
        }
      }
    }
  }
}
