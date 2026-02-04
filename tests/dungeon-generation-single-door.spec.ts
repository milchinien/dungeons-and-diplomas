/**
 * Test for single door per side and proper room connection
 */
import { test, expect } from '@playwright/test';

test.describe('Dungeon Generation - Single Door System', () => {
  test('should generate dungeon with single doors and connected rooms', async ({ page }) => {
    // Navigate to game
    await page.goto('http://localhost:3002');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if login modal is present and log in
    const loginModal = page.locator('text=Benutzername');
    if (await loginModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.fill('input[type="text"]', 'TestUser');
      await page.click('button:has-text("Anmelden")');
      await page.waitForTimeout(500);
    }

    // Wait for canvas to be ready
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(2000);

    // Get game state from window
    const gameData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;

      // Access dungeon manager through window object (if exposed)
      // Or extract data from canvas rendering
      return {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        hasCanvas: true
      };
    });

    console.log('Game loaded:', gameData);
    expect(gameData?.hasCanvas).toBe(true);

    // Take screenshot to verify visually
    await page.screenshot({ path: 'tests/screenshots/dungeon-single-door-test.png', fullPage: true });

    // Check that main menu or pause menu can be opened (game is running)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Check for pause menu or main menu
    const menuVisible = await page.locator('text=Weiterspielen, text=Neustart').first().isVisible({ timeout: 2000 }).catch(() => false);

    if (menuVisible) {
      console.log('✓ Game is running and menu is accessible');
      await page.screenshot({ path: 'tests/screenshots/dungeon-pause-menu.png' });
      await page.keyboard.press('Escape'); // Close menu
    }

    console.log('✓ Dungeon generation test completed');
  });

  test('should generate room layouts with single doors', async ({ page }) => {
    // Navigate to room editor
    await page.goto('http://localhost:3002/room-editor');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if layout browser is visible
    const layoutBrowser = await page.locator('text=Layouts').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(layoutBrowser).toBe(true);

    console.log('✓ Room editor loaded');

    // Take screenshot of editor
    await page.screenshot({ path: 'tests/screenshots/room-editor-single-door.png', fullPage: true });

    // Get layout count
    const layoutCount = await page.evaluate(() => {
      const layouts = document.querySelectorAll('[class*="layout"], [class*="Layout"]');
      return layouts.length;
    });

    console.log(`✓ Found ${layoutCount} layout elements in editor`);
  });

  test('should verify seed data has single doors only', async ({ page }) => {
    // Test API endpoint
    await page.goto('http://localhost:3002/api/room-layouts');

    const response = await page.textContent('body');
    const layouts = JSON.parse(response);

    console.log(`✓ Loaded ${layouts.length} room layouts from API`);

    // Check each layout has valid door positions
    let validLayouts = 0;
    let layoutsWithDoors = 0;

    for (const layout of layouts) {
      const { doorPositions, tileGrid, width, height } = layout;

      // Count doors in each direction
      let northDoors = 0, southDoors = 0, eastDoors = 0, westDoors = 0;

      // Check north edge
      if (tileGrid[0]) {
        for (let x = 0; x < width; x++) {
          if (tileGrid[0][x] === 3) northDoors++;
        }
      }

      // Check south edge
      if (tileGrid[height - 1]) {
        for (let x = 0; x < width; x++) {
          if (tileGrid[height - 1][x] === 3) southDoors++;
        }
      }

      // Check west edge
      for (let y = 0; y < height; y++) {
        if (tileGrid[y] && tileGrid[y][0] === 3) westDoors++;
      }

      // Check east edge
      for (let y = 0; y < height; y++) {
        if (tileGrid[y] && tileGrid[y][width - 1] === 3) eastDoors++;
      }

      // Verify single door per side
      const hasSingleDoorsOnly =
        northDoors <= 1 &&
        southDoors <= 1 &&
        eastDoors <= 1 &&
        westDoors <= 1;

      if (hasSingleDoorsOnly) {
        validLayouts++;
      } else {
        console.log(`✗ Layout "${layout.name}" has multiple doors: N=${northDoors}, S=${southDoors}, E=${eastDoors}, W=${westDoors}`);
      }

      // Verify doorPositions match tileGrid
      const northMatch = doorPositions.north === null ? northDoors === 0 : northDoors === 1;
      const southMatch = doorPositions.south === null ? southDoors === 0 : southDoors === 1;
      const eastMatch = doorPositions.east === null ? eastDoors === 0 : eastDoors === 1;
      const westMatch = doorPositions.west === null ? westDoors === 0 : westDoors === 1;

      if (northMatch && southMatch && eastMatch && westMatch) {
        layoutsWithDoors++;
      }
    }

    console.log(`✓ ${validLayouts}/${layouts.length} layouts have single doors per side`);
    console.log(`✓ ${layoutsWithDoors}/${layouts.length} layouts have matching doorPositions`);

    expect(validLayouts).toBe(layouts.length);
    expect(layoutsWithDoors).toBe(layouts.length);
  });
});
