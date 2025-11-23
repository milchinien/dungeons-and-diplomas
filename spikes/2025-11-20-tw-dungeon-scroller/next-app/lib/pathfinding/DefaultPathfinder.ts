/**
 * Default Pathfinder implementation using A* algorithm
 *
 * Wraps AStarPathfinder to implement the Pathfinder interface,
 * enabling dependency injection for testing.
 */

import { AStarPathfinder } from './AStarPathfinder';
import type { Pathfinder, PathCoord } from '../enemy/types';
import type { TileType } from '../constants';

/**
 * Default pathfinder that wraps the static AStarPathfinder
 */
export const defaultPathfinder: Pathfinder = {
  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): PathCoord[] {
    return AStarPathfinder.findPath(startX, startY, endX, endY, dungeon, doorStates);
  }
};
