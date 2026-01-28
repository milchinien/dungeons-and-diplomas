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
import { startSlash, updateSlash } from '../effects/SlashAnimation';
import { checkShopCounterCollision, getShopRoomAtPosition } from '../shop/ShopCollision';
import { canEnterShop, getLockedDoorMessage, updateShopDoorStates, isRoomCleared } from '../shop/ShopDoor';
import { Fireball } from '../projectiles';
import { FIREBALL_COUNT, FIREBALL_ARC_ANGLE, TRASHMOB_TYPE } from '../constants';

// Cheat system: Speed Boost flag
let speedBoostEnabled = false;

/**
 * Enable or disable Speed Boost (2x movement speed)
 */
export function setSpeedBoost(enabled: boolean): void {
  speedBoostEnabled = enabled;
  console.log(`[GameEngine] Speed Boost ${enabled ? 'ENABLED (2x)' : 'DISABLED'}`);
}

/**
 * Check if Speed Boost is enabled
 */
export function isSpeedBoostEnabled(): boolean {
  return speedBoostEnabled;
}

export class GameEngine {
  private lastSpacePressed: boolean = false;

  // Attack state
  private attackState: PlayerAttackState = createAttackState();

  // Fireball projectiles
  public fireballs: Fireball[] = [];

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

    // Start slash animation in the attack direction
    const angle = typeof attackDirection === 'number'
      ? attackDirection
      : { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[attackDirection];

    startSlash(angle);

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
    // Update slash animation
    updateSlash(dt);

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
    shrines?: Shrine[],
    rooms?: Room[],
    roomMap?: number[][]
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
    // Check shop counter collision if rooms and roomMap are provided
    if (rooms && roomMap) {
      const shopRoom = getShopRoomAtPosition(x, y, tileSize, roomMap, rooms);
      if (shopRoom && checkShopCounterCollision(x, y, tileSize, shopRoom)) {
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
            // Update shop door states when a room is cleared
            updateShopDoorStates(rooms, enemies);
          }
        }, 400); // Match reveal animation duration
      }
    } else if (room.state === 'exploring') {
      // Check if all enemies in room are defeated
      if (enemiesInRoom === 0) {
        room.state = 'explored';
        getEffectsManager().onRoomCleared(room, tileSize);
        // Update shop door states when a room is cleared
        updateShopDoorStates(rooms, enemies);
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

        // Check if door leads to a shop and if player can enter
        const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);
        const playerRoomId = roomMap[playerTileY]?.[playerTileX] ?? -1;
        const playerRoom = playerRoomId >= 0 ? rooms[playerRoomId] : null;

        // Find which room the door leads to (check adjacent tiles)
        const doorNeighbors = [
          { x: adjacentDoor.x - 1, y: adjacentDoor.y },
          { x: adjacentDoor.x + 1, y: adjacentDoor.y },
          { x: adjacentDoor.x, y: adjacentDoor.y - 1 },
          { x: adjacentDoor.x, y: adjacentDoor.y + 1 }
        ];

        let targetShopRoom: Room | null = null;
        for (const neighbor of doorNeighbors) {
          const neighborRoomId = roomMap[neighbor.y]?.[neighbor.x] ?? -1;
          if (neighborRoomId >= 0 && neighborRoomId !== playerRoomId) {
            const neighborRoom = rooms[neighborRoomId];
            if (neighborRoom?.type === 'shop') {
              targetShopRoom = neighborRoom;
              break;
            }
          }
        }

        // If door leads to shop, check if player can enter
        if (targetShopRoom && playerRoom && !isOpen) {
          if (!canEnterShop(targetShopRoom, playerRoom, enemies)) {
            // Door stays closed - player needs to clear the room first
            console.log(getLockedDoorMessage(playerRoom, enemies));
            this.lastSpacePressed = spacePressed;
            return;
          }
        }

        doorStates.set(doorKey, !isOpen);

        // Propagate toggle to any adjacent connected door (layout-based door pairs)
        const adjOffsets = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
        for (const off of adjOffsets) {
          const nx = adjacentDoor.x + off.dx;
          const ny = adjacentDoor.y + off.dy;
          if (nx >= 0 && nx < DUNGEON_WIDTH && ny >= 0 && ny < DUNGEON_HEIGHT && dungeon[ny][nx] === TILE.DOOR) {
            doorStates.set(`${nx},${ny}`, !isOpen);
          }
        }

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
      // Apply slowdown if attacking and speed boost if enabled
      const attackMultiplier = this.attackState.isAttacking ? PLAYER_ATTACK_SLOWDOWN : 1.0;
      const boostMultiplier = speedBoostEnabled ? 2.0 : 1.0;
      const currentSpeed = PLAYER_SPEED_TILES * tileSize * attackMultiplier * boostMultiplier;
      dx = dx / length * currentSpeed * dt;
      dy = dy / length * currentSpeed * dt;

      const newX = player.x + dx;
      const newY = player.y + dy;

      // Use player collision that respects door states and shrines
      if (!this.checkPlayerCollision(newX, player.y, tileSize, dungeon, doorStates, shrines, rooms, roomMap)) {
        player.x = newX;
      }
      if (!this.checkPlayerCollision(player.x, newY, tileSize, dungeon, doorStates, shrines, rooms, roomMap)) {
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
      onContactDamage,
      roomMap
    } = ctx;

    // Get player's room ID
    const playerTileX = Math.floor((player.x + tileSize / 2) / tileSize);
    const playerTileY = Math.floor((player.y + tileSize / 2) / tileSize);
    const playerRoomId = (roomMap && playerTileY >= 0 && playerTileY < roomMap.length &&
                          playerTileX >= 0 && playerTileX < roomMap[0]?.length)
      ? roomMap[playerTileY][playerTileX]
      : -1;

    // Update each trashmob
    for (const trashmob of trashmobs) {
      if (!trashmob.alive) continue;

      const wasAttacking = trashmob.isAttacking;
      trashmob.update(dt, player, tileSize, rooms, dungeon, doorStates);

      // Reset damage tracking when attack ends
      if (wasAttacking && !trashmob.isAttacking) {
        this.trashmobDamageDealt.delete(trashmob);
      }

      // Spawn fireballs for MAGE trashmobs when they're ready
      if (trashmob.type === TRASHMOB_TYPE.MAGE && trashmob.shouldSpawnFireballs()) {
        this.spawnFireballs(trashmob, player, tileSize);
      }

      // Check contact damage - only during attacks, after wind-up, and only once per attack
      // IMPORTANT: Only deal damage if trashmob is in the SAME room as player (prevents damage through walls/doors)
      if (trashmob.canDealDamage && !this.trashmobDamageDealt.has(trashmob)) {
        // Check if trashmob is in the same room as player
        const trashmobTileX = Math.floor((trashmob.x + tileSize / 2) / tileSize);
        const trashmobTileY = Math.floor((trashmob.y + tileSize / 2) / tileSize);
        const trashmobRoomId = (roomMap && trashmobTileY >= 0 && trashmobTileY < roomMap.length &&
                                trashmobTileX >= 0 && trashmobTileX < roomMap[0]?.length)
          ? roomMap[trashmobTileY][trashmobTileX]
          : -1;

        // Only allow damage if in the same room (or both on doors/corridors which have roomId -2)
        const sameRoom = playerRoomId >= 0 && trashmobRoomId >= 0 && playerRoomId === trashmobRoomId;
        const bothInCorridor = playerRoomId === -2 && trashmobRoomId === -2;

        if (sameRoom || bothInCorridor) {
          // BOMB type: explosion damage (area-of-effect, no contact check needed)
          if (trashmob.type === TRASHMOB_TYPE.BOMB) {
            const explosionDamage = trashmob.getExplosionDamage();
            console.log('[GameEngine] BOMB canDealDamage:', trashmob.canDealDamage, 'explosionDamage:', explosionDamage, 'sameRoom:', sameRoom);
            if (explosionDamage > 0) {
              console.log('[GameEngine] Applying BOMB damage:', explosionDamage);
              onContactDamage(explosionDamage);
              this.trashmobDamageDealt.add(trashmob);
            }
          }
          // Other types: contact damage (touch-based, requires isAttacking)
          else if (trashmob.isAttacking) {
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
  }

  /**
   * Spawn 5 fireballs in an arc from a MAGE trashmob
   */
  private spawnFireballs(trashmob: Trashmob, player: Player, tileSize: number): void {
    const baseAngle = trashmob.getShootingAngle(player, tileSize);
    const halfArc = FIREBALL_ARC_ANGLE / 2;

    // Spawn position (center of trashmob)
    const spawnX = trashmob.x + tileSize / 2;
    const spawnY = trashmob.y + tileSize / 2;

    // Create 5 fireballs spread in an arc
    for (let i = 0; i < FIREBALL_COUNT; i++) {
      // Calculate angle for this fireball
      // Spread evenly across the arc: -halfArc to +halfArc
      const angleOffset = (i / (FIREBALL_COUNT - 1)) * FIREBALL_ARC_ANGLE - halfArc;
      const fireballAngle = baseAngle + angleOffset;

      // Create and add fireball
      const fireball = new Fireball(spawnX, spawnY, fireballAngle, tileSize);
      this.fireballs.push(fireball);
    }
  }

  /**
   * Update all fireballs and check collisions with player
   */
  public updateFireballs(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    onContactDamage: (damage: number) => void
  ): void {
    // Update each fireball
    for (const fireball of this.fireballs) {
      if (!fireball.alive) continue;

      // Update position and check wall collisions
      fireball.update(dt, dungeon, tileSize);

      // Check player collision
      if (fireball.checkPlayerCollision(player.x, player.y, tileSize)) {
        onContactDamage(fireball.damage);

        // Trigger damage visual effects
        const effectsManager = getEffectsManager();
        const playerCenterX = player.x + tileSize / 2;
        const playerCenterY = player.y + tileSize / 2;
        effectsManager.onPlayerDamage(playerCenterX, playerCenterY, fireball.damage);
      }
    }

    // Remove dead fireballs
    this.fireballs = this.fireballs.filter(f => f.alive);
  }
}
