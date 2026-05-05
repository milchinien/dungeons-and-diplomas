import { test, expect } from '@playwright/test';

/**
 * E2E Test: Room traversal through connected door pairs
 *
 * Verifies that layout-based dungeon generation correctly connects rooms
 * with open door pairs and the player can traverse between them.
 */

test('connected door pairs are open', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const input = page.locator('input[type="text"]');
  await input.waitFor({ timeout: 10000 });
  await input.fill('door_pair_test');

  const startBtn = page.locator('button').filter({ hasText: /Starten/i });
  await startBtn.waitFor({ timeout: 5000 });
  await startBtn.click();

  const playBtn = page.locator('button').filter({ hasText: /Spielen/i });
  await playBtn.waitFor({ timeout: 10000 });
  await playBtn.click();

  await page.waitForTimeout(5000);

  const result = await page.evaluate(() => {
    const dm = (window as any).__dungeonManager;
    if (!dm) return { error: 'DungeonManager not exposed' };

    const dungeon = dm.dungeon as number[][];
    const rooms = dm.rooms as any[];
    const doorStates = dm.doorStates as Map<string, boolean>;

    let adjacentPairs = 0;
    let openPairs = 0;

    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[y].length; x++) {
        if (dungeon[y][x] !== 3) continue;
        // Check right neighbor
        if (x + 1 < dungeon[y].length && dungeon[y][x + 1] === 3) {
          adjacentPairs++;
          if (doorStates.get(`${x},${y}`) && doorStates.get(`${x + 1},${y}`)) openPairs++;
        }
        // Check bottom neighbor
        if (y + 1 < dungeon.length && dungeon[y + 1]?.[x] === 3) {
          adjacentPairs++;
          if (doorStates.get(`${x},${y}`) && doorStates.get(`${x},${y + 1}`)) openPairs++;
        }
      }
    }

    return {
      roomCount: rooms.length,
      allConnected: rooms.every((r: any) => r.neighbors.length > 0),
      adjacentPairs,
      openPairs
    };
  });

  console.log('Door pair check:', JSON.stringify(result));
  expect((result as any).roomCount).toBeGreaterThan(1);
  expect((result as any).allConnected).toBe(true);
  expect((result as any).adjacentPairs).toBeGreaterThan(0);
  expect((result as any).openPairs).toBe((result as any).adjacentPairs);
});

test('player can reach adjacent room via BFS pathfinding', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const input = page.locator('input[type="text"]');
  await input.waitFor({ timeout: 10000 });
  await input.fill('traversal_bfs_test');

  const startBtn = page.locator('button').filter({ hasText: /Starten/i });
  await startBtn.waitFor({ timeout: 5000 });
  await startBtn.click();

  const playBtn = page.locator('button').filter({ hasText: /Spielen/i });
  await playBtn.waitFor({ timeout: 10000 });
  await playBtn.click();

  await page.waitForTimeout(5000);

  // BFS from player to find a reachable path to another room
  const pathResult = await page.evaluate(() => {
    const dm = (window as any).__dungeonManager;
    if (!dm) return { error: 'no DungeonManager' };

    const tileSize = dm.tileSize;
    const dungeon = dm.dungeon;
    const roomMap = dm.roomMap;
    const doorStates = dm.doorStates;

    const startX = Math.floor(dm.player.x / tileSize);
    const startY = Math.floor(dm.player.y / tileSize);
    const startRoomId = roomMap[startY]?.[startX] ?? -1;

    const visited = new Set<string>();
    const queue: Array<{ x: number; y: number; path: Array<{ dx: number; dy: number }> }> = [];
    queue.push({ x: startX, y: startY, path: [] });
    visited.add(`${startX},${startY}`);

    const dirs = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const dir of dirs) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = `${nx},${ny}`;

        if (visited.has(key)) continue;
        if (nx < 0 || ny < 0 || ny >= dungeon.length || nx >= dungeon[0].length) continue;

        const tile = dungeon[ny][nx];

        if (tile === 3) { // DOOR
          if (!(doorStates.get(`${nx},${ny}`) ?? false)) continue; // skip closed doors
          // Check if beyond this door is another room
          for (const d2 of dirs) {
            const bx = nx + d2.dx, by = ny + d2.dy;
            if (by >= 0 && by < dungeon.length && bx >= 0 && bx < dungeon[0].length) {
              const beyondRoom = roomMap[by]?.[bx] ?? -1;
              if (beyondRoom >= 0 && beyondRoom !== startRoomId) {
                return {
                  startRoomId,
                  targetRoomId: beyondRoom,
                  pathLength: current.path.length + 1,
                  reachable: true
                };
              }
            }
          }
          visited.add(key);
          queue.push({ x: nx, y: ny, path: [...current.path, dir] });
        } else if (tile === 1) { // FLOOR
          visited.add(key);
          queue.push({ x: nx, y: ny, path: [...current.path, dir] });
        }
      }
    }

    return { startRoomId, reachable: false, error: 'No reachable adjacent room' };
  });

  console.log('Path result:', JSON.stringify(pathResult));
  expect((pathResult as any).reachable).toBe(true);
  expect((pathResult as any).targetRoomId).not.toBe((pathResult as any).startRoomId);
});