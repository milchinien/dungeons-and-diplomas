/**
 * Property tests for layout-based dungeon generation
 *
 * Runs the real generator many times against the real seed layouts and
 * asserts structural invariants. These tests guard against the class of
 * bugs where walls dissolve, rooms leak into the void, or rooms become
 * unreachable ("misplaced room parts").
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { TILE } from '../../lib/constants';
import { generateDungeonFromLayouts } from '../../lib/dungeon/layoutGeneration';
import { getLayoutPool, resetLayoutPool } from '../../lib/roomlayouts/LayoutPool';
import type { RoomLayout } from '../../lib/roomlayouts/types';
import seedLayouts from '../../lib/data/seed-room-layouts.json';

const RUNS = 50;

function toRoomLayouts(): RoomLayout[] {
  return (seedLayouts as Array<Omit<RoomLayout, 'id' | 'createdBy' | 'createdAt'>>).map(
    (layout, index) => ({
      ...layout,
      id: index + 1,
      createdBy: null,
      createdAt: new Date(0),
    })
  );
}

describe('Layout-based dungeon generation (property tests)', () => {
  beforeAll(() => {
    resetLayoutPool();
    getLayoutPool().setLayouts(toRoomLayouts());
  });

  it(`generates sealed, fully reachable dungeons (${RUNS} runs)`, () => {
    for (let run = 0; run < RUNS; run++) {
      const { dungeon, rooms, roomMap } = generateDungeonFromLayouts(20);

      expect(rooms.length).toBeGreaterThanOrEqual(2);

      // Invariant 1: sealed — no walkable tile borders the void
      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[y].length; x++) {
          const tile = dungeon[y][x];
          if (tile !== TILE.FLOOR && tile !== TILE.DOOR) continue;
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            const neighbor = dungeon[y + dy]?.[x + dx] ?? TILE.EMPTY;
            expect(
              neighbor,
              `run ${run}: walkable tile (${x},${y}) borders EMPTY at (${x + dx},${y + dy})`
            ).not.toBe(TILE.EMPTY);
          }
        }
      }

      // Invariant 2: every room is reachable from the first room (flood fill
      // over floor/door tiles)
      const start = findFloorInRoom(dungeon, roomMap, rooms[0].id);
      expect(start, `run ${run}: first room has no floor`).not.toBeNull();

      const reachableRooms = floodFillRooms(dungeon, roomMap, start!);
      for (const room of rooms) {
        expect(
          reachableRooms.has(room.id),
          `run ${run}: room ${room.id} (${room.width}x${room.height} at ${room.x},${room.y}) unreachable`
        ).toBe(true);
      }

      // Invariant 3: every floor tile belongs to a room in roomMap
      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[y].length; x++) {
          if (dungeon[y][x] === TILE.FLOOR) {
            expect(
              roomMap[y][x],
              `run ${run}: floor tile (${x},${y}) has no room assignment`
            ).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
});

function findFloorInRoom(
  dungeon: number[][],
  roomMap: number[][],
  roomId: number
): { x: number; y: number } | null {
  for (let y = 0; y < dungeon.length; y++) {
    for (let x = 0; x < dungeon[y].length; x++) {
      if (dungeon[y][x] === TILE.FLOOR && roomMap[y][x] === roomId) {
        return { x, y };
      }
    }
  }
  return null;
}

function floodFillRooms(
  dungeon: number[][],
  roomMap: number[][],
  start: { x: number; y: number }
): Set<number> {
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const queue = [start];
  const reachable = new Set<number>();

  while (queue.length > 0) {
    const { x, y } = queue.pop()!;
    if (roomMap[y]?.[x] >= 0) reachable.add(roomMap[y][x]);

    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      const tile = dungeon[ny]?.[nx];
      if (!seen.has(key) && (tile === TILE.FLOOR || tile === TILE.DOOR)) {
        seen.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return reachable;
}
