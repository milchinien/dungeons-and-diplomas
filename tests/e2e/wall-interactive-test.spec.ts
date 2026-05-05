import { test, expect } from '@playwright/test';

test.describe('Interactive Wall Test', () => {
  test('should show game for 2 minutes with player movement', async ({ page }) => {
    // Configure longer timeout
    test.setTimeout(180000); // 3 minutes

    // Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.fill('input[type="text"]', 'InteractiveUser');

    const submitButton = page.locator('button:has-text("Starten"), button:has-text("Start"), button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Click play button if available
    const playButton = page.locator('button:has-text("Spielen"), button:has-text("Play")').first();
    if (await playButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await playButton.click();
    }

    // Wait for game canvas
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('\n=== INTERACTIVE TEST STARTED ===');
    console.log('Test will run for 2 minutes');
    console.log('Player will move around to test wall rendering');
    console.log('====================================\n');

    // Movement sequence: explore different rooms
    const movements = [
      { key: 'ArrowRight', duration: 3000, label: 'Moving right' },
      { key: 'ArrowDown', duration: 2000, label: 'Moving down' },
      { key: 'ArrowLeft', duration: 3000, label: 'Moving left' },
      { key: 'ArrowUp', duration: 2000, label: 'Moving up' },
      { key: 'ArrowRight', duration: 4000, label: 'Exploring right' },
      { key: 'ArrowDown', duration: 3000, label: 'Exploring down' },
      { key: 'ArrowUp', duration: 3000, label: 'Moving back up' },
      { key: 'ArrowLeft', duration: 2000, label: 'Moving left' },
      { key: 'ArrowRight', duration: 3000, label: 'Moving right again' },
      { key: 'ArrowDown', duration: 4000, label: 'Going deeper' }
    ];

    let totalTime = 0;
    let screenshotCount = 0;

    for (let i = 0; i < movements.length && totalTime < 120000; i++) {
      const move = movements[i];
      console.log(`[${Math.floor(totalTime / 1000)}s] ${move.label}...`);

      // Press and hold the key
      await page.keyboard.down(move.key);
      await page.waitForTimeout(move.duration);
      await page.keyboard.up(move.key);

      // Check wall data
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
          doubleWalls,
          missingWalls
        };
      });

      console.log(`   Double: ${wallData.doubleWalls}, Missing: ${wallData.missingWalls}`);

      // Take screenshot
      await page.screenshot({
        path: `test-results/interactive-wall-${screenshotCount}.png`,
        fullPage: false
      });
      screenshotCount++;

      totalTime += move.duration + 100;

      // Small pause between movements
      await page.waitForTimeout(500);
    }

    // Hold at the end for visual inspection
    console.log('\nHolding for final 30 seconds...');
    await page.waitForTimeout(30000);

    // Final screenshot
    await page.screenshot({
      path: 'test-results/interactive-wall-final.png',
      fullPage: false
    });

    console.log('\n=== TEST COMPLETE ===\n');
  });
});
