import { test, expect } from '@playwright/test';

test.describe('Quick Wall Check', () => {
  test('should load game and check for wall issues', async ({ page }) => {
    // Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login - wait for button to be clickable
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.fill('input[type="text"]', 'WallTestUser');

    // Find the submit button (it should be enabled after entering username)
    const submitButton = page.locator('button:has-text("Starten"), button:has-text("Start"), button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Look for "Spielen" or "Play" button in main menu
    const playButton = page.locator('button:has-text("Spielen"), button:has-text("Play"), button:has-text("Spiel")').first();

    // If main menu appears, click play
    if (await playButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await playButton.click();
      await page.waitForTimeout(3000);
    } else {
      // Game might already be running
      await page.waitForTimeout(3000);
    }

    // Wait for game canvas
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    // Give it time to render
    await page.waitForTimeout(2000);

    // Get dungeon data
    const wallData = await page.evaluate(() => {
      const data = (window as any).dungeonTestData;
      if (!data) return { error: 'No data' };

      const { dungeon, rooms, roomMap } = data;
      let doubleWalls = 0;
      let missingWalls = 0;

      // Quick double wall check
      for (let y = 0; y < dungeon.length - 1; y++) {
        for (let x = 0; x < dungeon[0].length; x++) {
          if (dungeon[y][x] === 2 && dungeon[y + 1][x] === 2) {
            const rAbove = roomMap[y - 1]?.[x];
            const rBelow = roomMap[y + 2]?.[x];
            if (rAbove >= 0 && rBelow >= 0 && rAbove !== rBelow) {
              doubleWalls++;
            }
          }
        }
      }

      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[0].length - 1; x++) {
          if (dungeon[y][x] === 2 && dungeon[y][x + 1] === 2) {
            const rLeft = roomMap[y]?.[x - 1];
            const rRight = roomMap[y]?.[x + 2];
            if (rLeft >= 0 && rRight >= 0 && rLeft !== rRight) {
              doubleWalls++;
            }
          }
        }
      }

      // Quick missing wall check
      for (const room of rooms) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (dungeon[room.y]?.[x] === 0) missingWalls++;
          if (dungeon[room.y + room.height - 1]?.[x] === 0) missingWalls++;
        }
        for (let y = room.y; y < room.y + room.height; y++) {
          if (dungeon[y]?.[room.x] === 0) missingWalls++;
          if (dungeon[y]?.[room.x + room.width - 1] === 0) missingWalls++;
        }
      }

      return {
        totalRooms: rooms.length,
        doubleWalls,
        missingWalls
      };
    });

    console.log('\n=== Quick Wall Check ===');
    console.log(`Rooms: ${wallData.totalRooms}`);
    console.log(`Double Walls: ${wallData.doubleWalls}`);
    console.log(`Missing Walls: ${wallData.missingWalls}`);
    console.log('========================\n');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/wall-quick-check.png',
      fullPage: false
    });

    // Log if there are issues
    if (wallData.doubleWalls > 0 || wallData.missingWalls > 0) {
      console.log('⚠️  Wall issues detected!');
    } else {
      console.log('✅ No wall issues found');
    }
  });
});
