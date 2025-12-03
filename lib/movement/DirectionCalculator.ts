import { DIRECTION } from '../constants';
import type { Direction } from '../constants';

/**
 * Direction calculation utility for movement
 *
 * Determines which direction an entity should face based on
 * movement delta (dx, dy) using cardinal directions.
 */
export class DirectionCalculator {
  /**
   * Calculate direction based on movement delta
   *
   * Prioritizes horizontal movement over vertical when the magnitudes are similar.
   * Uses absolute values to determine which axis has greater movement.
   *
   * @param dx Horizontal movement delta
   * @param dy Vertical movement delta
   * @returns Direction enum value (UP, DOWN, LEFT, RIGHT)
   */
  static calculateDirection(dx: number, dy: number): Direction {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      return dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }
  }
}
