import { test, expect } from '@playwright/test';

test.describe('Dungeon Wall Visual Check with Fog of War Off', () => {
  test('should have proper walls around all rooms', async ({ page }) => {
    // Navigate to game
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login
    await page.waitForSelector('text=Dungeons & Diplomas', { timeout: 10000 });
    await page.fill('input[type="text"]', 'WallCheckUser');
    await page.click('button:has-text("Starten")');

    // Wait for main menu and click Spielen
    await page.waitForSelector('button:has-text("Spielen")', { timeout: 10000 });
    await page.click('button:has-text("Spielen")');

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Get dungeon data
    const dungeonData = await page.evaluate(() => {
      return (window as any).dungeonTestData;
    });

    if (!dungeonData) {
      console.log('No dungeon data available');
      return;
    }

    const { dungeon, rooms } = dungeonData;

    console.log(`Checking ${rooms.length} rooms for proper walls...`);

    let missingWalls = 0;
    const issues: string[] = [];

    // Check each room's perimeter
    // NOTE: Room bounds INCLUDE the walls, so we check the EDGES of the room, not outside
    for (const room of rooms) {
      // Check top edge (y = room.y, should be wall or door)
      for (let x = room.x; x < room.x + room.width; x++) {
        const y = room.y;
        const tile = dungeon[y][x];
        if (tile !== 2 && tile !== 3 && tile !== 1) { // Not wall, door, or floor (floor is OK if door removed)
          missingWalls++;
          issues.push(`Room ${room.id}: Missing top wall at (${x}, ${y}), found tile ${tile}`);
        }
      }

      // Check bottom edge (y = room.y + room.height - 1)
      for (let x = room.x; x < room.x + room.width; x++) {
        const y = room.y + room.height - 1;
        const tile = dungeon[y][x];
        if (tile !== 2 && tile !== 3 && tile !== 1) {
          missingWalls++;
          issues.push(`Room ${room.id}: Missing bottom wall at (${x}, ${y}), found tile ${tile}`);
        }
      }

      // Check left edge (x = room.x)
      for (let y = room.y; y < room.y + room.height; y++) {
        const x = room.x;
        const tile = dungeon[y][x];
        if (tile !== 2 && tile !== 3 && tile !== 1) {
          missingWalls++;
          issues.push(`Room ${room.id}: Missing left wall at (${x}, ${y}), found tile ${tile}`);
        }
      }

      // Check right edge (x = room.x + room.width - 1)
      for (let y = room.y; y < room.y + room.height; y++) {
        const x = room.x + room.width - 1;
        const tile = dungeon[y][x];
        if (tile !== 2 && tile !== 3 && tile !== 1) {
          missingWalls++;
          issues.push(`Room ${room.id}: Missing right wall at (${x}, ${y}), found tile ${tile}`);
        }
      }
    }

    if (missingWalls > 0) {
      console.log(`Found ${missingWalls} missing wall tiles`);
      console.log('First 10 issues:', issues.slice(0, 10));
    }

    expect(missingWalls).toBe(0);
  });
});
