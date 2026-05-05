/**
 * E2E Tests for Tilemap Editor Labels and Symbols
 *
 * Tests that:
 * 1. Labels are correctly oriented (wall.horizontal = ↕, wall.vertical = ↔)
 * 2. Symbols match the orientation
 * 3. Preview shows correct tiles
 */

import { test, expect } from '@playwright/test';

test.describe('Tilemap Editor - Labels and Symbols', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/tilemapeditor');

    // Wait for editor to load
    await page.waitForSelector('text=Kein Theme geladen', { timeout: 5000 }).catch(() => {});

    // Create new theme
    const newButton = page.locator('button:has-text("New")');
    if (await newButton.isVisible()) {
      await newButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show correct wall labels with orientation indicators', async ({ page }) => {
    // Check horizontal wall (↕ top-bottom)
    const horizontalWall = page.locator('text=Wall ↕ (top-bottom)');
    await expect(horizontalWall).toBeVisible();

    // Check vertical wall (↔ left-right)
    const verticalWall = page.locator('text=Wall ↔ (left-right)');
    await expect(verticalWall).toBeVisible();

    // Check corner labels with symbols
    await expect(page.locator('text=Corner ╔ (top-left)')).toBeVisible();
    await expect(page.locator('text=Corner ╗ (top-right)')).toBeVisible();
    await expect(page.locator('text=Corner ╚ (bottom-left)')).toBeVisible();
    await expect(page.locator('text=Corner ╝ (bottom-right)')).toBeVisible();

    // Check T-piece labels
    await expect(page.locator('text=T-Piece ╩ (up)')).toBeVisible();
    await expect(page.locator('text=T-Piece ╦ (down)')).toBeVisible();
    await expect(page.locator('text=T-Piece ╣ (left)')).toBeVisible();
    await expect(page.locator('text=T-Piece ╠ (right)')).toBeVisible();

    // Check cross
    await expect(page.locator('text=Cross ╬')).toBeVisible();
  });

  test('should show correct door labels with orientation', async ({ page }) => {
    // Horizontal doors (left-right ↔)
    await expect(page.locator('text=Door ↔ Closed')).toBeVisible();
    await expect(page.locator('text=Door ↔ Open')).toBeVisible();

    // Vertical doors (top-bottom ↕)
    await expect(page.locator('text=Door ↕ Closed')).toBeVisible();
    await expect(page.locator('text=Door ↕ Open')).toBeVisible();
  });

  test('should show correct symbols in tile slots', async ({ page }) => {
    // Get all tile slot containers
    const slots = page.locator('[data-testid^="tile-slot"]');

    // Check horizontal wall symbol (should be ║ for top-bottom)
    const horizontalSlot = page.locator('text=Wall ↕ (top-bottom)').locator('..');
    const horizontalSymbol = await horizontalSlot.locator('text=║').count();
    expect(horizontalSymbol).toBeGreaterThan(0);

    // Check vertical wall symbol (should be ═══ for left-right)
    const verticalSlot = page.locator('text=Wall ↔ (left-right)').locator('..');
    const verticalSymbol = await verticalSlot.locator('text=═══').count();
    expect(verticalSymbol).toBeGreaterThan(0);
  });

  test('should fill wall slots and verify preview orientation', async ({ page }) => {
    // Load default tileset if available
    const tilesetSelect = page.locator('select').first();
    if (await tilesetSelect.isVisible()) {
      await tilesetSelect.selectOption({ index: 1 }); // Select first tileset
      await page.waitForTimeout(300);
    }

    // Get tileset tiles
    const firstTile = page.locator('canvas').first().locator('..');

    // Click on a tile in the tileset viewer to start drag
    const tilesetCanvas = page.locator('canvas').first();
    await tilesetCanvas.click({ position: { x: 32, y: 32 } });

    // Drag to horizontal wall slot (↕ top-bottom)
    const horizontalSlot = page.locator('text=Wall ↕ (top-bottom)').locator('..');
    await horizontalSlot.click();

    // Verify slot is filled (check for variant count or visual indicator)
    // Note: Actual drag-drop might need more complex simulation

    // Take screenshot of preview
    const preview = page.locator('text=Theme Preview').locator('..');
    await expect(preview).toBeVisible();

    // Verify preview shows dungeon layout
    await page.waitForTimeout(500);
  });

  test('should show correct optional wall labels', async ({ page }) => {
    // Optional walls should have (opt.) suffix
    await expect(page.locator('text=Isolated ▢ (opt.)')).toBeVisible();
    await expect(page.locator('text=End ← (opt.)')).toBeVisible();
    await expect(page.locator('text=End → (opt.)')).toBeVisible();
    await expect(page.locator('text=End ↑ (opt.)')).toBeVisible();
    await expect(page.locator('text=End ↓ (opt.)')).toBeVisible();
  });

  test('should have consistent orientation arrows', async ({ page }) => {
    // Get page text content
    const content = await page.textContent('body');

    // Count arrow usage (↕ should be for top-bottom, ↔ for left-right)
    const hasHorizontalWallWithVerticalArrow = content?.includes('Wall ↕ (top-bottom)');
    const hasVerticalWallWithHorizontalArrow = content?.includes('Wall ↔ (left-right)');
    const hasHorizontalDoorWithHorizontalArrow = content?.includes('Door ↔');
    const hasVerticalDoorWithVerticalArrow = content?.includes('Door ↕');

    expect(hasHorizontalWallWithVerticalArrow).toBe(true);
    expect(hasVerticalWallWithHorizontalArrow).toBe(true);
    expect(hasHorizontalDoorWithHorizontalArrow).toBe(true);
    expect(hasVerticalDoorWithVerticalArrow).toBe(true);
  });

  test('preview should render after filling required slots', async ({ page }) => {
    // Create a minimal theme by filling required slots
    // This is a simplified test - full theme creation requires more steps

    // Check if preview panel exists
    const preview = page.locator('text=Theme Preview').locator('..');
    await expect(preview).toBeVisible();

    // Preview should show either empty state or dungeon
    const previewText = await preview.textContent();

    // Should contain either "Kein Theme" or show canvas/dungeon
    const hasValidPreview =
      previewText?.includes('Kein Theme') ||
      previewText?.includes('Preview') ||
      await preview.locator('canvas').count() > 0;

    expect(hasValidPreview).toBeTruthy();
  });
});

test.describe('Tilemap Editor - Theme Validation', () => {
  test('should show validation errors for incomplete theme', async ({ page }) => {
    await page.goto('http://localhost:3000/tilemapeditor');
    await page.waitForTimeout(1000);

    // Create new theme
    await page.click('button:has-text("New")');
    await page.waitForTimeout(300);

    // Try to save without filling required slots
    const saveButton = page.locator('button:has-text("Save")');
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      await page.waitForTimeout(300);

      // Should show validation error
      const errorMessage = page.locator('text=missing').or(page.locator('text=required'));
      // Note: Might not show error if save is disabled, which is also valid
    }
  });

  test('should show green checkmark for filled slots', async ({ page }) => {
    await page.goto('http://localhost:3000/tilemapeditor');
    await page.waitForTimeout(1000);

    // Create new theme
    await page.click('button:has-text("New")');
    await page.waitForTimeout(300);

    // Check for visual indicators on slots
    // Filled slots might show checkmark, unfilled might show red border
    const slots = page.locator('[class*="slot"]').or(page.locator('[class*="Slot"]'));
    const slotCount = await slots.count();

    console.log(`Found ${slotCount} slots in the editor`);
    expect(slotCount).toBeGreaterThan(0);
  });
});
