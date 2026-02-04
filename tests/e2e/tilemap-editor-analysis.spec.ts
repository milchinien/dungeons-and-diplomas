import { test, expect } from '@playwright/test';

test.describe('Tilemap Editor Analysis', () => {
  test('analyze tilemap editor labels and preview', async ({ page }) => {
    // Open tilemap editor
    await page.goto('http://localhost:3000/tilemapeditor');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot of initial state
    await page.screenshot({
      path: 'tests/e2e/screenshots/tilemap-editor-initial.png',
      fullPage: true
    });

    // Click "Neu" button to create new theme
    await page.click('button:has-text("Neu")');
    await page.waitForTimeout(500);

    // Take screenshot after creating new theme
    await page.screenshot({
      path: 'tests/e2e/screenshots/tilemap-editor-new-theme.png',
      fullPage: true
    });

    // Check that optional wall end pieces are NOT visible
    const endLeftSlot = await page.locator('text=/End.*left/i').count();
    const endRightSlot = await page.locator('text=/End.*right/i').count();
    const endTopSlot = await page.locator('text=/End.*top/i').count();
    const endBottomSlot = await page.locator('text=/End.*bottom/i').count();

    console.log('End pieces count:', {
      endLeft: endLeftSlot,
      endRight: endRightSlot,
      endTop: endTopSlot,
      endBottom: endBottomSlot
    });

    // Get all wall slot labels
    const wallLabels = await page.locator('.text-xs').allTextContents();
    console.log('All labels:', wallLabels);

    // Take screenshot of filled theme (if possible)
    await page.screenshot({
      path: 'tests/e2e/screenshots/tilemap-editor-labels.png',
      fullPage: true
    });
  });
});
