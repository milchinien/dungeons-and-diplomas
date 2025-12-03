/**
 * Enemy rendering logic - HP bar, status display, aggro visualization
 */
import type { Room } from '../constants';
import type { Enemy } from './Enemy';
import type { Player } from './types';
import { AI_STATE } from '../constants';

export class EnemyRenderer {
  /**
   * Draw the enemy sprite, status bar, and aggro radius visualization
   */
  static draw(
    enemy: Enemy,
    ctx: CanvasRenderingContext2D,
    rooms: Room[],
    tileSize: number,
    player?: Player,
    playerRoomIds?: Set<number>
  ): void {
    if (!enemy.sprite || !enemy.sprite.loaded) return;

    // Only draw if the enemy's room is visible
    if (enemy.roomId >= 0 && rooms[enemy.roomId] && !rooms[enemy.roomId].visible) {
      return;
    }

    // Only show aggro visuals after reaction timer has elapsed
    const hasAggro = enemy.aiState === AI_STATE.FOLLOWING && enemy.aggroReactionTimer <= 0;

    // Only draw enemies in the player's current room(s) OR if they have aggro
    if (playerRoomIds !== undefined && playerRoomIds.size > 0 && !playerRoomIds.has(enemy.roomId) && !hasAggro) {
      return;
    }

    // Draw aggro radius visualization if player is close
    if (player && enemy.alive) {
      this.drawAggroRadius(enemy, ctx, player, tileSize);
    }

    // Draw sprite with level-based scaling
    this.drawSprite(enemy, ctx, tileSize);

    // Draw status bar
    this.drawStatusBar(enemy, ctx, tileSize, hasAggro);
  }

  /**
   * Draw aggro radius circle when player is nearby
   */
  private static drawAggroRadius(
    enemy: Enemy,
    ctx: CanvasRenderingContext2D,
    player: Player,
    tileSize: number
  ): void {
    const distanceToPlayer = enemy.getDistanceToPlayer(player, tileSize);
    const drawRadiusThreshold = enemy.getAggroRadius() + 0.5;

    if (distanceToPlayer <= drawRadiusThreshold) {
      const aggroRadius = enemy.getAggroRadius();
      const centerX = enemy.x + tileSize / 2;
      const centerY = enemy.y + tileSize / 2;
      const radiusInPixels = aggroRadius * tileSize;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radiusInPixels, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  /**
   * Draw the enemy sprite with level-based scaling
   */
  private static drawSprite(
    enemy: Enemy,
    ctx: CanvasRenderingContext2D,
    tileSize: number
  ): void {
    // Calculate level-based scale
    // Level 1: 0.5x (50%), Level 5: 1.0x (100%), Level 10: 1.5x (150%)
    const scale = 1.0 + (enemy.level - 5) * 0.1;
    const scaledSize = tileSize * scale;

    // Center the scaled sprite on the enemy's position
    const offsetX = enemy.x + (tileSize - scaledSize) / 2;
    const offsetY = enemy.y + (tileSize - scaledSize) / 2;

    enemy.sprite!.draw(ctx, offsetX, offsetY, scaledSize, scaledSize);
  }

  /**
   * Draw status bar above enemy (subject, level, HP)
   */
  private static drawStatusBar(
    enemy: Enemy,
    ctx: CanvasRenderingContext2D,
    tileSize: number,
    hasAggro: boolean
  ): void {
    const statusText = enemy.alive
      ? `${enemy.subject} | Lvl ${enemy.level} | HP ${enemy.hp}`
      : `${enemy.subject} | Lvl ${enemy.level} | BESIEGT`;

    // Color based on level: 1-3 green, 4-7 yellow, 8-10 red
    let borderColor = '#4CAF50'; // green
    if (enemy.level >= 8) {
      borderColor = '#FF4444'; // red
    } else if (enemy.level >= 4) {
      borderColor = '#FFC107'; // yellow
    }

    // Dim colors for dead enemies
    if (!enemy.alive) {
      borderColor = '#888888';
    }

    ctx.save();

    // Larger font and padding when enemy has aggro
    const fontSize = hasAggro ? 14 : 12;
    const padding = hasAggro ? 10 : 6;
    ctx.font = `${hasAggro ? 'bold ' : ''}${fontSize}px Arial`;
    ctx.textAlign = 'center';

    // Measure text width
    const textWidth = ctx.measureText(statusText).width;
    const barWidth = textWidth + padding * 2;
    const barHeight = hasAggro ? 26 : 20;

    // Calculate sprite offset for positioning
    const scale = 1.0 + (enemy.level - 5) * 0.1;
    const scaledSize = tileSize * scale;
    const offsetY = enemy.y + (tileSize - scaledSize) / 2;

    // Position bar above the scaled sprite
    const barX = enemy.x + tileSize / 2 - barWidth / 2;
    const barY = offsetY - barHeight - 4;

    // Draw red glow effect when enemy has aggro
    if (hasAggro && enemy.alive) {
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw background
    ctx.fillStyle = hasAggro && enemy.alive ? 'rgba(40, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw border with level-based color (or red when aggro)
    ctx.strokeStyle = hasAggro && enemy.alive ? '#FF4444' : borderColor;
    ctx.lineWidth = hasAggro ? 2 : 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Reset shadow for text
    ctx.shadowBlur = 0;

    // Draw text with level-based color (or red when aggro)
    ctx.fillStyle = hasAggro && enemy.alive ? '#FF6666' : borderColor;
    ctx.fillText(statusText, enemy.x + tileSize / 2, barY + (hasAggro ? 18 : 14));

    ctx.restore();
  }
}
