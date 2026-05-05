import { test, expect } from '@playwright/test';

test.describe('Tilemap Editor Quick Check', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  test('check tilemap editor state', async ({ page }) => {
    // Open tilemap editor
    await page.goto('/tilemapeditor');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Click "Neu" button to create new theme
    const neuButton = page.locator('button:has-text("Neu")');
    if (await neuButton.count() > 0) {
      await neuButton.click();
      await page.waitForTimeout(1000);
    }

    // Check that END pieces are NOT visible in optional walls
    const wallsOptionalSection = page.locator('h2:has-text("WALLS (OPTIONAL)")').locator('..');
    const endPieceCount = await wallsOptionalSection.locator('text=/End.*←|End.*→|End.*↑|End.*↓/i').count();

    console.log('END pieces visible:', endPieceCount);
    expect(endPieceCount).toBe(0);

    // Check that Isolated is still visible
    const isolatedCount = await wallsOptionalSection.locator('text=/Isolated/i').count();
    console.log('Isolated visible:', isolatedCount);
    expect(isolatedCount).toBe(1);

    // Get all wall labels
    const requiredWallsSection = page.locator('h2:has-text("WALLS (PFLICHT)")').locator('..');
    const requiredLabels = await requiredWallsSection.locator('.text-xs').allTextContents();

    console.log('Required wall labels:', requiredLabels);

    // Screenshot
    await page.screenshot({
      path: 'tilemap-editor-state.png',
      fullPage: true
    });

    console.log('Screenshot saved to tilemap-editor-state.png');
  });
});
