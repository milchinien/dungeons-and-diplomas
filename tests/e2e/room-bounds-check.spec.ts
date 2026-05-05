import { test, expect } from '@playwright/test';

test.describe('Room Bounds Check', () => {
  test('should verify room bounds match actual floor tiles', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.fill('input[type="text"]', 'BoundsCheckUser');

    const submitButton = page.locator('button:has-text("Starten"), button:has-text("Start"), button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    const playButton = page.locator('button:has-text("Spielen"), button:has-text("Play")').first();
    if (await playButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await playButton.click();
    }

    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000);

    const boundsAnalysis = await page.evaluate(() => {
      const data = (window as any).dungeonTestData;
      if (!data) return { error: 'No data' };

      const { dungeon, rooms, roomMap } = data;
      const issues: string[] = [];

      // Analyze first 3 rooms
      for (let i = 0; i < Math.min(3, rooms.length); i++) {
        const room = rooms[i];
        issues.push(`\n=== Room ${room.id} ===`);
        issues.push(`Bounds: x=${room.x}, y=${room.y}, w=${room.width}, h=${room.height}`);

        // Check what's actually at the room boundaries
        issues.push('Top edge tiles:');
        for (let x = room.x; x < room.x + Math.min(room.width, 5); x++) {
          const tile = dungeon[room.y]?.[x];
          const tileType = tile === 0 ? 'EMPTY' : tile === 1 ? 'FLOOR' : tile === 2 ? 'WALL' : tile === 3 ? 'DOOR' : 'UNKNOWN';
          issues.push(`  (${x}, ${room.y}): ${tileType}`);
        }

        issues.push('Bottom edge tiles:');
        const bottomY = room.y + room.height - 1;
        for (let x = room.x; x < room.x + Math.min(room.width, 5); x++) {
          const tile = dungeon[bottomY]?.[x];
          const tileType = tile === 0 ? 'EMPTY' : tile === 1 ? 'FLOOR' : tile === 2 ? 'WALL' : tile === 3 ? 'DOOR' : 'UNKNOWN';
          issues.push(`  (${x}, ${bottomY}): ${tileType}`);
        }

        issues.push('Left edge tiles:');
        for (let y = room.y; y < room.y + Math.min(room.height, 5); y++) {
          const tile = dungeon[y]?.[room.x];
          const tileType = tile === 0 ? 'EMPTY' : tile === 1 ? 'FLOOR' : tile === 2 ? 'WALL' : tile === 3 ? 'DOOR' : 'UNKNOWN';
          issues.push(`  (${room.x}, ${y}): ${tileType}`);
        }

        issues.push('Right edge tiles:');
        const rightX = room.x + room.width - 1;
        for (let y = room.y; y < room.y + Math.min(room.height, 5); y++) {
          const tile = dungeon[y]?.[rightX];
          const tileType = tile === 0 ? 'EMPTY' : tile === 1 ? 'FLOOR' : tile === 2 ? 'WALL' : tile === 3 ? 'DOOR' : 'UNKNOWN';
          issues.push(`  (${rightX}, ${y}): ${tileType}`);
        }

        // Check tiles OUTSIDE the room bounds
        issues.push('Tiles just outside room:');
        if (room.y > 0) {
          const tile = dungeon[room.y - 1]?.[room.x];
          const tileType = tile === 0 ? 'EMPTY' : tile === 1 ? 'FLOOR' : tile === 2 ? 'WALL' : tile === 3 ? 'DOOR' : 'UNKNOWN';
          issues.push(`  Above (${room.x}, ${room.y - 1}): ${tileType}`);
        }
        if (room.x > 0) {
          const tile = dungeon[room.y]?.[room.x - 1];
          const tileType = tile === 0 ? 'EMPTY' : tile === 1 ? 'FLOOR' : tile === 2 ? 'WALL' : tile === 3 ? 'DOOR' : 'UNKNOWN';
          issues.push(`  Left of (${room.x - 1}, ${room.y}): ${tileType}`);
        }
      }

      return {
        totalRooms: rooms.length,
        issues
      };
    });

    console.log('\n=== Room Bounds Analysis ===');
    boundsAnalysis.issues?.forEach((line: string) => console.log(line));
    console.log('============================\n');
  });
});
