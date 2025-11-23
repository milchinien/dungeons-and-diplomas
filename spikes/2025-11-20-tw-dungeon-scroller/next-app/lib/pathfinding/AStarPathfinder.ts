import { TILE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../constants';
import type { TileType } from '../constants';

export interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic (estimated cost to goal)
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

/**
 * A* Pathfinder for enemy navigation
 * Supports dynamic obstacles like closed doors
 */
export class AStarPathfinder {
  /**
   * Check if a tile is walkable for enemies
   */
  private static isWalkable(
    x: number,
    y: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): boolean {
    if (x < 0 || x >= DUNGEON_WIDTH || y < 0 || y >= DUNGEON_HEIGHT) {
      return false;
    }

    const tile = dungeon[y][x];

    // Floor is always walkable
    if (tile === TILE.FLOOR) return true;

    // Door is walkable only if open
    if (tile === TILE.DOOR) {
      return doorStates.get(`${x},${y}`) ?? false;
    }

    // Everything else (WALL, EMPTY, CORNER) is not walkable
    return false;
  }

  /**
   * Manhattan distance heuristic
   */
  private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Get node key for map storage
   */
  private static nodeKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Find path from start to goal using A*
   * Returns array of {x, y} tile coordinates, or empty array if no path found
   *
   * @param startX Start tile X
   * @param startY Start tile Y
   * @param goalX Goal tile X
   * @param goalY Goal tile Y
   * @param dungeon 2D array of tile types
   * @param doorStates Map of door states
   * @param maxIterations Maximum iterations to prevent infinite loops (default 1000)
   */
  static findPath(
    startX: number,
    startY: number,
    goalX: number,
    goalY: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>,
    maxIterations: number = 1000
  ): { x: number; y: number }[] {
    // Quick check: if goal is not walkable, return empty path
    if (!this.isWalkable(goalX, goalY, dungeon, doorStates)) {
      // Try to find walkable tile near goal
      const nearGoal = this.findNearestWalkable(goalX, goalY, dungeon, doorStates);
      if (!nearGoal) return [];
      goalX = nearGoal.x;
      goalY = nearGoal.y;
    }

    // If start equals goal, return empty path (already there)
    if (startX === goalX && startY === goalY) {
      return [];
    }

    const openSet: Map<string, PathNode> = new Map();
    const closedSet: Set<string> = new Set();

    // Create start node
    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, goalX, goalY),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;

    openSet.set(this.nodeKey(startX, startY), startNode);

    // 8-directional movement (including diagonals)
    const directions = [
      { dx: 0, dy: -1, cost: 1 },    // up
      { dx: 0, dy: 1, cost: 1 },     // down
      { dx: -1, dy: 0, cost: 1 },    // left
      { dx: 1, dy: 0, cost: 1 },     // right
      { dx: -1, dy: -1, cost: 1.41 }, // up-left (diagonal ~sqrt(2))
      { dx: 1, dy: -1, cost: 1.41 },  // up-right
      { dx: -1, dy: 1, cost: 1.41 },  // down-left
      { dx: 1, dy: 1, cost: 1.41 }    // down-right
    ];

    let iterations = 0;

    while (openSet.size > 0 && iterations < maxIterations) {
      iterations++;

      // Find node with lowest f score
      let currentNode: PathNode | null = null;
      let lowestF = Infinity;

      for (const node of openSet.values()) {
        if (node.f < lowestF) {
          lowestF = node.f;
          currentNode = node;
        }
      }

      if (!currentNode) break;

      // Check if we reached the goal
      if (currentNode.x === goalX && currentNode.y === goalY) {
        return this.reconstructPath(currentNode);
      }

      // Move current node from open to closed set
      const currentKey = this.nodeKey(currentNode.x, currentNode.y);
      openSet.delete(currentKey);
      closedSet.add(currentKey);

      // Explore neighbors
      for (const { dx, dy, cost } of directions) {
        const neighborX = currentNode.x + dx;
        const neighborY = currentNode.y + dy;
        const neighborKey = this.nodeKey(neighborX, neighborY);

        // Skip if already visited
        if (closedSet.has(neighborKey)) continue;

        // Skip if not walkable
        if (!this.isWalkable(neighborX, neighborY, dungeon, doorStates)) continue;

        // For diagonal movement, also check that we can actually move diagonally
        // (both adjacent tiles must be walkable to prevent corner cutting)
        if (dx !== 0 && dy !== 0) {
          const canPassHorizontal = this.isWalkable(currentNode.x + dx, currentNode.y, dungeon, doorStates);
          const canPassVertical = this.isWalkable(currentNode.x, currentNode.y + dy, dungeon, doorStates);
          if (!canPassHorizontal || !canPassVertical) continue;
        }

        const tentativeG = currentNode.g + cost;

        let neighborNode = openSet.get(neighborKey);

        if (!neighborNode) {
          // New node
          neighborNode = {
            x: neighborX,
            y: neighborY,
            g: tentativeG,
            h: this.heuristic(neighborX, neighborY, goalX, goalY),
            f: 0,
            parent: currentNode
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openSet.set(neighborKey, neighborNode);
        } else if (tentativeG < neighborNode.g) {
          // Better path found
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = currentNode;
        }
      }
    }

    // No path found
    return [];
  }

  /**
   * Reconstruct path from goal node back to start
   */
  private static reconstructPath(goalNode: PathNode): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let current: PathNode | null = goalNode;

    while (current !== null) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    // Remove start position (enemy is already there)
    if (path.length > 0) {
      path.shift();
    }

    return path;
  }

  /**
   * Find nearest walkable tile to a given position
   */
  private static findNearestWalkable(
    x: number,
    y: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): { x: number; y: number } | null {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isWalkable(nx, ny, dungeon, doorStates)) {
        return { x: nx, y: ny };
      }
    }

    return null;
  }
}
