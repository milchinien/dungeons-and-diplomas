import { SpriteSheetLoader } from './SpriteSheetLoader';
import { DIRECTION, ANIMATION, AI_STATE, ENEMY_SPEED_TILES, ENEMY_AGGRO_RADIUS, ENEMY_DEAGGRO_RADIUS, ENEMY_IDLE_WAIT_TIME, GOBLIN_MAX_HP, PLAYER_SIZE, TILE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from './constants';
import type { Direction, AIStateType, TileType, Room } from './constants';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  isMoving: boolean;
  hp: number;
  maxHp: number;
}

export class Enemy {
  x: number;
  y: number;
  roomId: number;
  sprite: SpriteSheetLoader | null = null;
  spriteName: string;
  direction: Direction = DIRECTION.DOWN;
  isMoving: boolean = false;
  alive: boolean = true;

  // HP system
  hp: number = GOBLIN_MAX_HP;
  maxHp: number = GOBLIN_MAX_HP;

  // AI state
  aiState: AIStateType = AI_STATE.IDLE;
  waypoint: { x: number; y: number } | null = null;
  idleTimer: number = 0;

  constructor(x: number, y: number, spriteName: string, roomId: number) {
    this.x = x;
    this.y = y;
    this.roomId = roomId;
    this.spriteName = spriteName;
  }

  async load() {
    this.sprite = new SpriteSheetLoader(this.spriteName);
    await this.sprite.load();
    this.sprite.playAnimation(this.direction, ANIMATION.IDLE);
  }

  getDistanceToPlayer(player: Player, tileSize: number): number {
    const dx = (player.x + tileSize / 2) - (this.x + tileSize / 2);
    const dy = (player.y + tileSize / 2) - (this.y + tileSize / 2);
    return Math.sqrt(dx * dx + dy * dy) / tileSize; // Return distance in tiles
  }

  pickRandomWaypoint(rooms: Room[], dungeon: TileType[][], roomMap: number[][], tileSize: number) {
    // Get all floor tiles in this enemy's room
    const room = rooms[this.roomId];
    if (!room) return;

    const roomFloorTiles: { x: number; y: number }[] = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
          if (dungeon[y][x] === TILE.FLOOR && roomMap[y][x] === this.roomId) {
            roomFloorTiles.push({ x: x * tileSize, y: y * tileSize });
          }
        }
      }
    }

    if (roomFloorTiles.length > 0) {
      this.waypoint = roomFloorTiles[Math.floor(Math.random() * roomFloorTiles.length)];
    }
  }

  update(
    dt: number,
    player: Player,
    tileSize: number,
    rooms: Room[],
    dungeon: TileType[][],
    roomMap: number[][],
    onCombatStart: (enemy: Enemy) => void,
    inCombat: boolean
  ) {
    if (!this.sprite) return;

    // Update sprite animation (even when dead for hurt animation)
    this.sprite.update(dt);

    // Skip AI if dead
    if (!this.alive) return;

    // AI Logic
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

    // State transitions
    if (this.aiState === AI_STATE.FOLLOWING) {
      // Deaggro if player is too far
      if (distanceToPlayer > ENEMY_DEAGGRO_RADIUS) {
        this.aiState = AI_STATE.IDLE;
        this.idleTimer = ENEMY_IDLE_WAIT_TIME;
      }
    } else {
      // Aggro if player is close
      if (distanceToPlayer <= ENEMY_AGGRO_RADIUS) {
        this.aiState = AI_STATE.FOLLOWING;
        this.waypoint = null;
      }
    }

    // Execute behavior based on state
    if (this.aiState === AI_STATE.IDLE) {
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) {
        // Start wandering
        this.aiState = AI_STATE.WANDERING;
        this.pickRandomWaypoint(rooms, dungeon, roomMap, tileSize);
      }
      this.sprite.playAnimation(this.direction, ANIMATION.IDLE);

    } else if (this.aiState === AI_STATE.WANDERING) {
      if (!this.waypoint) {
        // No waypoint, go back to idle
        this.aiState = AI_STATE.IDLE;
        this.idleTimer = ENEMY_IDLE_WAIT_TIME;
        return;
      }

      // Move towards waypoint
      const dx = this.waypoint.x - this.x;
      const dy = this.waypoint.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        // Reached waypoint
        this.aiState = AI_STATE.IDLE;
        this.idleTimer = ENEMY_IDLE_WAIT_TIME;
        this.waypoint = null;
        this.sprite.playAnimation(this.direction, ANIMATION.IDLE);
      } else {
        // Move towards waypoint
        const speed = ENEMY_SPEED_TILES * tileSize * dt;
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;

        const newX = this.x + moveX;
        const newY = this.y + moveY;

        // Simple collision check
        if (!this.checkCollision(newX, this.y, tileSize, dungeon)) {
          this.x = newX;
        }
        if (!this.checkCollision(this.x, newY, tileSize, dungeon)) {
          this.y = newY;
        }

        // Update direction
        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
        } else {
          this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
        }

        this.sprite.playAnimation(this.direction, ANIMATION.WALK);
      }

    } else if (this.aiState === AI_STATE.FOLLOWING) {
      // Chase the player
      const dx = (player.x + tileSize / 2) - (this.x + tileSize / 2);
      const dy = (player.y + tileSize / 2) - (this.y + tileSize / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > tileSize / 2) {
        // Move towards player
        const speed = ENEMY_SPEED_TILES * tileSize * dt;
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;

        const newX = this.x + moveX;
        const newY = this.y + moveY;

        // Simple collision check
        if (!this.checkCollision(newX, this.y, tileSize, dungeon)) {
          this.x = newX;
        }
        if (!this.checkCollision(this.x, newY, tileSize, dungeon)) {
          this.y = newY;
        }

        // Update direction
        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
        } else {
          this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
        }

        this.sprite.playAnimation(this.direction, ANIMATION.RUN);
      } else {
        // Close enough - start combat!
        if (!inCombat) {
          onCombatStart(this);
        }
        this.sprite.playAnimation(this.direction, ANIMATION.IDLE);
      }
    }
  }

  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.aiState = AI_STATE.IDLE; // Stop moving
    if (this.sprite) {
      this.sprite.playAnimation(this.direction, ANIMATION.HURT);
      this.sprite.stopOnLastFrame = true; // Stop on last frame of hurt animation
    }
  }

  checkCollision(x: number, y: number, tileSize: number, dungeon: TileType[][]): boolean {
    const enemySize = tileSize * PLAYER_SIZE;
    const margin = (tileSize - enemySize) / 2;

    const left = x + margin;
    const right = x + tileSize - margin;
    const top = y + margin;
    const bottom = y + tileSize - margin;

    const points = [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom }
    ];

    for (let p of points) {
      const tileX = Math.floor(p.x / tileSize);
      const tileY = Math.floor(p.y / tileSize);

      if (tileX < 0 || tileX >= DUNGEON_WIDTH || tileY < 0 || tileY >= DUNGEON_HEIGHT) {
        return true;
      }

      if (dungeon[tileY][tileX] === TILE.WALL || dungeon[tileY][tileX] === TILE.EMPTY) {
        return true;
      }
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, rooms: Room[], tileSize: number) {
    if (!this.sprite || !this.sprite.loaded) return;

    // Only draw if the enemy's room is visible
    if (this.roomId >= 0 && rooms[this.roomId] && !rooms[this.roomId].visible) {
      return;
    }

    // Draw alive or dead (corpse)
    this.sprite.draw(ctx, this.x, this.y, tileSize, tileSize);
  }
}
