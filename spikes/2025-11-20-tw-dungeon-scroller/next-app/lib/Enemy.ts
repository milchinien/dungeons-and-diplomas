import { SpriteSheetLoader } from './SpriteSheetLoader';
import { DIRECTION, ANIMATION, AI_STATE, ENEMY_SPEED_TILES, ENEMY_AGGRO_RADIUS, ENEMY_DEAGGRO_RADIUS, ENEMY_IDLE_WAIT_TIME, ENEMY_WAYPOINT_THRESHOLD, COMBAT_TRIGGER_DISTANCE, GOBLIN_MAX_HP, TILE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from './constants';
import type { Direction, AIStateType, TileType, Room } from './constants';
import { CollisionDetector } from './physics/CollisionDetector';
import { DirectionCalculator } from './movement/DirectionCalculator';

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

  // HP system (initialized in constructor based on level)
  hp: number;
  maxHp: number;

  // Level and subject
  level: number;
  subject: string;

  // AI state
  aiState: AIStateType = AI_STATE.IDLE;
  waypoint: { x: number; y: number } | null = null;
  idleTimer: number = 0;

  // Dynamic aggro radius based on player ELO
  playerElo: number = 5; // Default to middle ELO

  constructor(x: number, y: number, spriteName: string, roomId: number, level: number, subject: string) {
    this.x = x;
    this.y = y;
    this.roomId = roomId;
    this.spriteName = spriteName;
    this.level = level;
    this.subject = subject;

    // Dynamic HP based on level: 10 + level * 5
    // Level 1: 15 HP, Level 5: 35 HP, Level 10: 60 HP
    this.hp = 10 + level * 5;
    this.maxHp = this.hp;
  }

  /**
   * Calculate dynamic aggro radius based on player ELO vs enemy level
   * Formula: BASE_AGGRO * (1 + (enemyLevel - playerElo) / 10)
   *
   * Multiplier ranges from 0.1 to 1.9:
   * - ELO 10 vs Level 1: 3 * 0.1 = 0.3 tiles (very short)
   * - ELO 5 vs Level 5: 3 * 1.0 = 3 tiles (balanced)
   * - ELO 1 vs Level 10: 3 * 1.9 = 5.7 tiles (very long)
   */
  getAggroRadius(): number {
    const baseAggroRadius = ENEMY_AGGRO_RADIUS; // 3 tiles
    const multiplier = 1 + (this.level - this.playerElo) / 10;
    return baseAggroRadius * multiplier;
  }

  /**
   * Calculate dynamic deaggro radius (2x aggro radius)
   */
  getDeaggroRadius(): number {
    return this.getAggroRadius() * 2;
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

  updateRoomId(tileSize: number, roomMap: number[][]) {
    // Update room ID based on current tile position
    const tileX = Math.floor((this.x + tileSize / 2) / tileSize);
    const tileY = Math.floor((this.y + tileSize / 2) / tileSize);

    if (tileX >= 0 && tileX < DUNGEON_WIDTH && tileY >= 0 && tileY < DUNGEON_HEIGHT) {
      const currentRoomId = roomMap[tileY][tileX];
      // Only update if standing on a valid room tile (not wall/door)
      if (currentRoomId >= 0) {
        this.roomId = currentRoomId;
      }
    }
  }

  getSpeedMultiplier(): number {
    // Level-based speed scaling
    // Level 1: 0.75x (75%, -25%), Level 5: 1.0x (100%), Level 10: 1.25x (125%, +25%)
    // Formula: speedMultiplier = 1.0 + (level - 5) * 0.05
    return 1.0 + (this.level - 5) * 0.05;
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

    // Freeze enemy AI during combat (just like player movement)
    if (inCombat) return;

    // Update room ID based on current position
    this.updateRoomId(tileSize, roomMap);

    // AI Logic
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);
    const aggroRadius = this.getAggroRadius();
    const deaggroRadius = this.getDeaggroRadius();

    // State transitions
    if (this.aiState === AI_STATE.FOLLOWING) {
      // Deaggro if player is too far
      if (distanceToPlayer > deaggroRadius) {
        this.aiState = AI_STATE.IDLE;
        this.idleTimer = ENEMY_IDLE_WAIT_TIME;
      }
    } else {
      // Aggro if player is close
      if (distanceToPlayer <= aggroRadius) {
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

      if (distance < ENEMY_WAYPOINT_THRESHOLD) {
        // Reached waypoint
        this.aiState = AI_STATE.IDLE;
        this.idleTimer = ENEMY_IDLE_WAIT_TIME;
        this.waypoint = null;
        this.sprite.playAnimation(this.direction, ANIMATION.IDLE);
      } else {
        // Move towards waypoint (with level-based speed scaling)
        const speedMultiplier = this.getSpeedMultiplier();
        const speed = ENEMY_SPEED_TILES * tileSize * dt * speedMultiplier;
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
        this.direction = DirectionCalculator.calculateDirection(dx, dy);

        this.sprite.playAnimation(this.direction, ANIMATION.WALK);
      }

    } else if (this.aiState === AI_STATE.FOLLOWING) {
      // Chase the player
      const dx = (player.x + tileSize / 2) - (this.x + tileSize / 2);
      const dy = (player.y + tileSize / 2) - (this.y + tileSize / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > tileSize * COMBAT_TRIGGER_DISTANCE) {
        // Move towards player (with level-based speed scaling)
        const speedMultiplier = this.getSpeedMultiplier();
        const speed = ENEMY_SPEED_TILES * tileSize * dt * speedMultiplier;
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
        this.direction = DirectionCalculator.calculateDirection(dx, dy);

        this.sprite.playAnimation(this.direction, ANIMATION.RUN);
      } else {
        // Close enough - start combat!
        // Only start combat if enemy is alive and not already in combat
        if (!inCombat && this.alive) {
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
    // Enemies use special collision that includes doors
    return CollisionDetector.checkEnemyCollision(x, y, tileSize, dungeon);
  }

  draw(ctx: CanvasRenderingContext2D, rooms: Room[], tileSize: number, player?: Player) {
    if (!this.sprite || !this.sprite.loaded) return;

    // Only draw if the enemy's room is visible
    if (this.roomId >= 0 && rooms[this.roomId] && !rooms[this.roomId].visible) {
      return;
    }

    // Draw aggro radius visualization if player is close
    if (player && this.alive) {
      const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

      const drawRadiusThreshold = this.getAggroRadius() + 0.5; // Show when within aggro radius + 0.5 tiles

      // Show aggro radius when player is within 0.5 tiles
      if (distanceToPlayer <= drawRadiusThreshold) {
        const aggroRadius = this.getAggroRadius();
        const centerX = this.x + tileSize / 2;
        const centerY = this.y + tileSize / 2;
        const radiusInPixels = aggroRadius * tileSize;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'; // Weak red
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed lines
        ctx.beginPath();
        ctx.arc(centerX, centerY, radiusInPixels, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
        ctx.restore();
      }
    }

    // Calculate level-based scale
    // Level 1: 0.5x (50%), Level 5: 1.0x (100%), Level 10: 1.5x (150%)
    // Formula: scale = 1.0 + (level - 5) * 0.1
    const scale = 1.0 + (this.level - 5) * 0.1;
    const scaledSize = tileSize * scale;

    // Center the scaled sprite on the enemy's position
    const offsetX = this.x + (tileSize - scaledSize) / 2;
    const offsetY = this.y + (tileSize - scaledSize) / 2;

    // Draw alive or dead (corpse) with level-based scaling
    this.sprite.draw(ctx, offsetX, offsetY, scaledSize, scaledSize);

    // Draw status bar (alive or dead)
    // Show status even for corpses so player can see what level enemy was defeated
    const statusText = this.alive
      ? `${this.subject} | Lvl ${this.level} | HP ${this.hp}`
      : `${this.subject} | Lvl ${this.level} | BESIEGT`;

    // Color based on level: 1-3 green, 4-7 yellow, 8-10 red
    let borderColor = '#4CAF50'; // green
    if (this.level >= 8) {
      borderColor = '#FF4444'; // red
    } else if (this.level >= 4) {
      borderColor = '#FFC107'; // yellow
    }

    // Dim colors for dead enemies
    if (!this.alive) {
      borderColor = '#888888'; // Gray for defeated enemies
    }

    ctx.save();
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Measure text width
    const textWidth = ctx.measureText(statusText).width;
    const padding = 6;
    const barWidth = textWidth + padding * 2;
    const barHeight = 20;

    // Position bar above the scaled sprite (centered on tile, but above scaled height)
    const barX = this.x + tileSize / 2 - barWidth / 2;
    const barY = offsetY - barHeight - 4;

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw border with level-based color
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Draw text with level-based color
    ctx.fillStyle = borderColor;
    ctx.fillText(statusText, this.x + tileSize / 2, barY + 14);

    ctx.restore();
  }
}
