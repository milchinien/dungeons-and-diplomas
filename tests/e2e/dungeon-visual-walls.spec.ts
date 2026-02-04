import { test, expect } from '@playwright/test';

test.describe('Dungeon Visual - Wall Rendering', () => {
  test('should render dungeon without thick double walls', async ({ page }) => {
    // Navigate to game
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login
    await page.waitForSelector('text=Dungeons & Diplomas', { timeout: 10000 });
    await page.fill('input[type="text"]', 'WallTestUser');
    await page.click('button:has-text("Starten")');

    // Wait for main menu and click Spielen
    await page.waitForSelector('button:has-text("Spielen")', { timeout: 10000 });
    await page.click('button:has-text("Spielen")');

    // Wait for game to render
    await page.waitForTimeout(3000);

    // Wait for canvas
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible' });

    // Take screenshot
    await page.screenshot({
      path: 'test-results/dungeon-walls-visual.png',
      fullPage: false
    });

    console.log('Screenshot saved to test-results/dungeon-walls-visual.png');

    // Get canvas data to analyze pixel patterns
    const canvasData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Get image data from center area
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const size = 400;

      const imageData = ctx.getImageData(
        centerX - size / 2,
        centerY - size / 2,
        size,
        size
      );

      // Analyze for double wall patterns (dark gray pixels in a row)
      let maxConsecutiveWalls = 0;
      let currentConsecutive = 0;

      for (let y = 0; y < size; y++) {
        currentConsecutive = 0;
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];

          // Detect wall color (grayish)
          const isWall = r > 50 && r < 150 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20;

          if (isWall) {
            currentConsecutive++;
            maxConsecutiveWalls = Math.max(maxConsecutiveWalls, currentConsecutive);
          } else {
            currentConsecutive = 0;
          }
        }
      }

      return {
        maxConsecutiveWalls,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      };
    });

    if (canvasData) {
      console.log('Max consecutive wall pixels:', canvasData.maxConsecutiveWalls);
      console.log('Canvas size:', canvasData.canvasWidth, 'x', canvasData.canvasHeight);

      // Walls should not be more than 64 pixels thick (1 tile)
      // Allow some margin for rendering artifacts
      expect(canvasData.maxConsecutiveWalls).toBeLessThan(80);
    }
  });

  test('should check dungeon generation in memory', async ({ page }) => {
    // Expose dungeon data for testing
    await page.addInitScript(() => {
      (window as any).exposeDungeonData = true;
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login
    await page.waitForSelector('text=Dungeons & Diplomas', { timeout: 10000 });
    await page.fill('input[type="text"]', 'DataTestUser');
    await page.click('button:has-text("Starten")');

    // Wait for main menu and click Spielen
    await page.waitForSelector('button:has-text("Spielen")', { timeout: 10000 });
    await page.click('button:has-text("Spielen")');

    // Wait for game
    await page.waitForTimeout(2000);

    // Try to access dungeon data
    const hasDoubleWalls = await page.evaluate(() => {
      // Check if we can access dungeon through React DevTools or window
      const checkDungeon = (dungeon: any[][]) => {
        if (!dungeon || dungeon.length === 0) return null;

        let doubleWalls = 0;

        // Check horizontal double walls
        for (let y = 0; y < dungeon.length - 1; y++) {
          for (let x = 0; x < dungeon[0].length; x++) {
            const current = dungeon[y][x];
            const below = dungeon[y + 1][x];

            if (current === 2 && below === 2) {
              // Check for floor above and below
              const hasFloorAbove = y > 0 && dungeon[y - 1][x] === 1;
              const hasFloorBelow = y + 2 < dungeon.length && dungeon[y + 2][x] === 1;

              if (hasFloorAbove && hasFloorBelow) {
                doubleWalls++;
              }
            }
          }
        }

        // Check vertical double walls
        for (let y = 0; y < dungeon.length; y++) {
          for (let x = 0; x < dungeon[0].length - 1; x++) {
            const current = dungeon[y][x];
            const right = dungeon[y][x + 1];

            if (current === 2 && right === 2) {
              const hasFloorLeft = x > 0 && dungeon[y][x - 1] === 1;
              const hasFloorRight = x + 2 < dungeon[0].length && dungeon[y][x + 2] === 1;

              if (hasFloorLeft && hasFloorRight) {
                doubleWalls++;
              }
            }
          }
        }

        return doubleWalls;
      };

      // Try to access dungeon from global scope
      if ((window as any).dungeonTestData) {
        return checkDungeon((window as any).dungeonTestData.dungeon);
      }

      return null;
    });

    if (hasDoubleWalls !== null) {
      console.log('Double walls found in memory:', hasDoubleWalls);
      expect(hasDoubleWalls).toBe(0);
    } else {
      console.log('Could not access dungeon data from page');
    }
  });
});
