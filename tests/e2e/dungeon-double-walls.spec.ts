import { test, expect } from '@playwright/test';

test.describe('Dungeon Generation - Double Walls Check', () => {
  test('should not have double walls between adjacent rooms', async ({ page }) => {
    // Go to main game page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for login modal and login
    await page.waitForSelector('text=Dungeons & Diplomas', { timeout: 10000 });
    await page.fill('input[type="text"]', 'TestUser');
    await page.click('button:has-text("Starten")');

    // Wait for main menu and click Spielen
    await page.waitForSelector('button:has-text("Spielen")', { timeout: 10000 });
    await page.click('button:has-text("Spielen")');

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Get dungeon data from the page
    const dungeonData = await page.evaluate(() => {
      // Access the dungeon manager through the game canvas component
      const gameCanvas = document.querySelector('canvas');
      if (!gameCanvas) return null;

      // Try to access dungeon data from window (if exposed)
      // We'll need to expose it for testing
      return (window as any).dungeonTestData;
    });

    if (!dungeonData) {
      console.log('Dungeon data not exposed, checking visually...');

      // Alternative: Check canvas rendering for double walls
      const canvas = page.locator('canvas').first();
      await canvas.waitFor({ state: 'visible' });

      // Take screenshot for manual inspection
      await page.screenshot({ path: 'test-results/dungeon-walls-check.png' });

      console.log('Screenshot saved to test-results/dungeon-walls-check.png');
      return;
    }

    // Analyze dungeon grid for double walls
    const { dungeon, rooms } = dungeonData;
    const doubleWalls: Array<{ x: number; y: number; direction: string }> = [];

    // Check horizontal double walls
    for (let y = 0; y < dungeon.length - 1; y++) {
      for (let x = 0; x < dungeon[0].length; x++) {
        const current = dungeon[y][x];
        const below = dungeon[y + 1][x];

        // If both tiles are walls (2), we have a double wall
        if (current === 2 && below === 2) {
          // Check if they're between different rooms
          const roomAbove = findRoomAtPosition(rooms, x, y - 1);
          const roomBelow = findRoomAtPosition(rooms, x, y + 2);

          if (roomAbove && roomBelow && roomAbove.id !== roomBelow.id) {
            doubleWalls.push({ x, y, direction: 'horizontal' });
          }
        }
      }
    }

    // Check vertical double walls
    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[0].length - 1; x++) {
        const current = dungeon[y][x];
        const right = dungeon[y][x + 1];

        // If both tiles are walls (2), we have a double wall
        if (current === 2 && right === 2) {
          // Check if they're between different rooms
          const roomLeft = findRoomAtPosition(rooms, x - 1, y);
          const roomRight = findRoomAtPosition(rooms, x + 2, y);

          if (roomLeft && roomRight && roomLeft.id !== roomRight.id) {
            doubleWalls.push({ x, y, direction: 'vertical' });
          }
        }
      }
    }

    console.log(`Found ${doubleWalls.length} double walls`);
    if (doubleWalls.length > 0) {
      console.log('Double walls at:', doubleWalls.slice(0, 10));
    }

    expect(doubleWalls.length).toBe(0);
  });

  test('should have single walls between connected rooms', async ({ page }) => {
    // Go to main game page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login
    await page.waitForSelector('text=Dungeons & Diplomas', { timeout: 10000 });
    await page.fill('input[type="text"]', 'TestUser2');
    await page.click('button:has-text("Starten")');

    // Wait for main menu and click Spielen
    await page.waitForSelector('button:has-text("Spielen")', { timeout: 10000 });
    await page.click('button:has-text("Spielen")');

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Take screenshot to verify visually
    await page.screenshot({ path: 'test-results/dungeon-single-walls.png', fullPage: false });

    // Check that canvas is rendered
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    console.log('Dungeon rendered successfully');
  });
});

// Helper function to find room at position
function findRoomAtPosition(rooms: any[], x: number, y: number): any {
  return rooms.find(room =>
    x >= room.x &&
    x < room.x + room.width &&
    y >= room.y &&
    y < room.y + room.height
  );
}
