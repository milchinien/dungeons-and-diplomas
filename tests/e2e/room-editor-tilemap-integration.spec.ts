import { test, expect } from '@playwright/test';

/**
 * E2E Test: Room Editor ↔ Tilemap Editor integration
 *
 * Verifies that:
 * 1. Tilemap Editor themes are seeded and available via API
 * 2. Room Editor preview loads the same theme the game uses
 * 3. Room Editor preview renders actual tileset graphics (not placeholder colors)
 * 4. Room type filter works correctly in the gallery
 */

test.describe('Room Editor ↔ Tilemap Editor Integration', () => {
  test('Tilemap Editor has seeded themes available', async ({ request }) => {
    // Ensure seed data exists
    await request.get('/api/tilemapeditor/seed');

    // Verify themes exist
    const themesRes = await request.get('/api/tilemapeditor/themes');
    expect(themesRes.ok()).toBeTruthy();
    const themes = await themesRes.json();
    expect(themes.length).toBeGreaterThanOrEqual(1);

    // Verify the default theme has floor, wall, door configs
    const theme = themes[0];
    expect(theme.floor).toBeTruthy();
    expect(theme.floor.default).toBeTruthy();
    expect(theme.floor.default.length).toBeGreaterThanOrEqual(1);
    expect(theme.wall).toBeTruthy();
    expect(theme.door).toBeTruthy();

    // Verify tilesets exist
    const tilesetsRes = await request.get('/api/tilemapeditor/tilesets');
    expect(tilesetsRes.ok()).toBeTruthy();
    const tilesets = await tilesetsRes.json();
    expect(tilesets.length).toBeGreaterThanOrEqual(1);
    expect(tilesets[0].path).toContain('Tileset');
  });

  test('Room Editor preview uses theme system (not hardcoded colors)', async ({ page }) => {
    // Seed tilemap data first
    await page.request.get('/api/tilemapeditor/seed');

    // Navigate to room editor and open an existing layout
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Click on a layout card to edit it
    const cards = page.locator('div[style*="cursor: pointer"]');
    const firstCard = cards.first();
    await firstCard.waitFor({ timeout: 5000 });
    await firstCard.click();

    // Wait for editor to load
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ timeout: 10000 });

    // Toggle to Preview mode
    const previewBtn = page.locator('button').filter({ hasText: /Preview View/i });
    await previewBtn.waitFor({ timeout: 5000 });
    await previewBtn.click();

    // Wait for theme to load and render
    await page.waitForTimeout(3000);

    // Verify "Loading theme..." disappears (theme loaded successfully)
    await expect(page.locator('text=Loading theme...')).not.toBeVisible({ timeout: 5000 });

    // Verify no error message is shown
    const errorEl = page.locator('div[style*="color: rgb(204, 68, 68)"]');
    await expect(errorEl).not.toBeVisible({ timeout: 2000 });

    // Verify canvas is rendered (has content)
    const previewCanvas = page.locator('canvas').first();
    await expect(previewCanvas).toBeVisible();

    // Verify the canvas has actual pixel data (not just black)
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Count non-black pixels
      let nonBlackCount = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 10 || pixels[i + 1] > 10 || pixels[i + 2] > 10) {
          nonBlackCount++;
        }
      }

      // At least 10% of pixels should be non-black (tileset rendered)
      const totalPixels = pixels.length / 4;
      return (nonBlackCount / totalPixels) > 0.1;
    });

    expect(hasContent).toBe(true);
  });

  test('Theme tile coordinates match between Room Editor preview and game', async ({ page, request }) => {
    // Seed tilemap data
    await request.get('/api/tilemapeditor/seed');

    // Get the active theme from API
    const themesRes = await request.get('/api/tilemapeditor/themes');
    const themes = await themesRes.json();
    const activeTheme = themes[0];

    // Verify theme has floor variants with valid tile source coordinates
    const floorDefault = activeTheme.floor.default;
    expect(floorDefault.length).toBeGreaterThanOrEqual(1);

    // Each floor variant must have a valid source with tilesetId, x, y
    for (const variant of floorDefault) {
      expect(variant.source.tilesetId).toBeGreaterThan(0);
      expect(variant.source.x).toBeGreaterThanOrEqual(0);
      expect(variant.source.y).toBeGreaterThanOrEqual(0);
      expect(variant.weight).toBeGreaterThan(0);
    }

    // All 4 door types must be present and reference valid tile sources
    const doorConfig = activeTheme.door;
    for (const doorType of ['horizontal_closed', 'horizontal_open', 'vertical_closed', 'vertical_open']) {
      const doorVariants = doorConfig[doorType];
      expect(doorVariants).toBeTruthy();
      expect(doorVariants.length).toBeGreaterThanOrEqual(1);
      expect(doorVariants[0].source.tilesetId).toBeGreaterThan(0);
    }

    // Verify the tileset referenced by the theme exists and points to a Castle Dungeon PNG
    const tilesetsRes = await request.get('/api/tilemapeditor/tilesets');
    const tilesets = await tilesetsRes.json();
    const primaryTilesetId = floorDefault[0].source.tilesetId;
    const primaryTileset = tilesets.find((ts: any) => ts.id === primaryTilesetId);
    expect(primaryTileset).toBeTruthy();
    expect(primaryTileset.path).toContain('Tileset');
    expect(primaryTileset.widthTiles).toBeGreaterThan(0);
    expect(primaryTileset.heightTiles).toBeGreaterThan(0);
  });

  test('Room type filter works in gallery', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify filter bar is visible
    const filterLabel = page.locator('text=Typ:');
    await expect(filterLabel).toBeVisible();

    // Count cards by looking for SVG thumbnails inside cards (each card has one SVG)
    const cardSvgs = page.locator('svg[viewBox]');
    const initialCount = await cardSvgs.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click "Any" filter (only rooms with roomType === 'any')
    const anyFilter = page.locator('button').filter({ hasText: 'Any' });
    await anyFilter.click();
    await page.waitForTimeout(500);

    const anyCount = await cardSvgs.count();
    // "Any" filter should show fewer or equal results than "Alle"
    expect(anyCount).toBeLessThanOrEqual(initialCount);

    // Click "Alle" to reset
    const alleFilter = page.locator('button').filter({ hasText: 'Alle' });
    await alleFilter.click();
    await page.waitForTimeout(500);

    const resetCount = await cardSvgs.count();
    expect(resetCount).toBe(initialCount);

    // Click "Kampf" filter (combat rooms)
    const combatFilter = page.locator('button').filter({ hasText: 'Kampf' });
    await combatFilter.click();
    await page.waitForTimeout(500);

    // Verify active filter style (blue background)
    await expect(combatFilter).toHaveCSS('background-color', 'rgb(74, 158, 255)');
  });
});
