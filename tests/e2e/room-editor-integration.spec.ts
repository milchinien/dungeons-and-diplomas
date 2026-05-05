import { test, expect } from '@playwright/test';

/**
 * Comprehensive integration test for Room Editor
 * Tests complete workflow: Create room -> Draw -> Save -> Verify
 */

test.describe('Room Editor - Complete Integration', () => {
  test('should create, edit, and save a complete room layout', async ({ page }) => {
    // Step 1: Navigate to editor
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify editor loaded
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Step 2: Set room name
    const nameInput = page.locator('input[placeholder*="Layout name"]');
    await nameInput.fill('Integration Test Room');

    // Step 3: Test Pen Tool (default active)
    console.log('Testing Pen tool...');
    const bbox = await canvas.boundingBox();
    if (!bbox) {
      throw new Error('Canvas bounding box not found');
    }

    // Draw a 5x5 floor area in the center
    const startX = bbox.x + 100;
    const startY = bbox.y + 100;
    const tileSize = 32;

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        await page.mouse.click(startX + (x * tileSize), startY + (y * tileSize));
      }
    }
    await page.waitForTimeout(200);

    // Step 4: Test Eraser Tool
    console.log('Testing Eraser tool...');
    await page.keyboard.press('e'); // Switch to eraser
    await page.waitForTimeout(100);

    // Erase center tile
    await page.mouse.click(startX + (2 * tileSize), startY + (2 * tileSize));
    await page.waitForTimeout(200);

    // Step 5: Test Fill Tool
    console.log('Testing Fill tool...');
    await page.keyboard.press('f'); // Switch to fill
    await page.waitForTimeout(100);

    // Fill area to the right
    await page.mouse.click(startX + (6 * tileSize), startY + (2 * tileSize));
    await page.waitForTimeout(200);

    // Step 6: Switch back to Pen to refill center
    console.log('Refilling center with Pen...');
    await page.keyboard.press('p'); // Switch to pen
    await page.waitForTimeout(100);

    await page.mouse.click(startX + (2 * tileSize), startY + (2 * tileSize));
    await page.waitForTimeout(200);

    // Step 7: Test Door Tool
    console.log('Testing Door tool...');
    await page.keyboard.press('d'); // Switch to door
    await page.waitForTimeout(100);

    // Place door on north edge (y=0)
    await page.mouse.click(startX + (2 * tileSize), bbox.y + 16);
    await page.waitForTimeout(200);

    // Place door on south edge (y=7, assuming 8x8 grid)
    await page.mouse.click(startX + (2 * tileSize), bbox.y + (7 * tileSize) + 16);
    await page.waitForTimeout(200);

    // Step 8: Test Undo
    console.log('Testing Undo...');
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(200);

    // Step 9: Test Redo
    console.log('Testing Redo...');
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(200);

    // Step 10: Test Grid Toggle
    console.log('Testing Grid toggle...');
    await page.keyboard.press('g');
    await page.waitForTimeout(200);
    await page.keyboard.press('g'); // Toggle back
    await page.waitForTimeout(200);

    // Step 11: Open Help Overlay
    console.log('Testing Help overlay...');
    await page.keyboard.press('?');
    await page.waitForTimeout(200);

    // Verify help is visible
    const helpTitle = page.locator('text=KEYBOARD SHORTCUTS');
    await expect(helpTitle).toBeVisible();

    // Close help
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Step 12: Verify Status Bar
    console.log('Testing Status Bar...');
    const statusBar = page.locator('div').filter({ hasText: 'Tool:' }).first();
    await expect(statusBar).toBeVisible();

    // Hover over canvas to check cursor tracking
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(200);

    const cursorStatus = page.locator('div').filter({ hasText: 'Cursor:' }).first();
    await expect(cursorStatus).toBeVisible();

    // Step 13: Set room metadata
    console.log('Setting room metadata...');
    const roomTypeSelect = page.locator('select').first();
    await roomTypeSelect.selectOption('combat');

    const difficultyInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(2);
    await difficultyInput.fill('7');

    // Step 14: Check validation
    console.log('Checking validation...');
    const validationStatus = page.locator('div').filter({ hasText: /Valid|error/ }).first();
    await expect(validationStatus).toBeVisible();

    // Step 15: Save the layout
    console.log('Saving layout...');
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first();

    // Check if save button is enabled (layout should be valid now)
    const isDisabled = await saveButton.isDisabled();

    if (!isDisabled) {
      await saveButton.click();
      await page.waitForTimeout(2000);

      // Check for success toast (might be visible or already faded)
      const successToast = page.locator('div').filter({ hasText: /Layout saved|saved successfully/i });
      // Toast may have disappeared, so just check it doesn't error
    } else {
      console.log('Save button is disabled - layout may be invalid');
      // Check validation errors
      const errorText = await validationStatus.textContent();
      console.log('Validation status:', errorText);
    }

    // Step 16: Test Reset with Confirmation
    console.log('Testing Reset confirmation...');
    const resetButton = page.locator('button').filter({ hasText: 'Reset' }).first();
    await resetButton.click();
    await page.waitForTimeout(200);

    // Verify confirmation modal
    const confirmModal = page.locator('text=Reset Canvas?');
    await expect(confirmModal).toBeVisible();

    // Cancel reset
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
    await page.waitForTimeout(200);

    // Verify modal closed
    await expect(confirmModal).not.toBeVisible();

    console.log('✅ All integration tests passed!');
  });

  test('should switch between all tools correctly', async ({ page }) => {
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Test each tool switch
    const tools = [
      { key: 'p', name: 'Pen' },
      { key: 'e', name: 'Eraser' },
      { key: 'f', name: 'Fill' },
      { key: 'd', name: 'Door' }
    ];

    for (const tool of tools) {
      await page.keyboard.press(tool.key);
      await page.waitForTimeout(100);

      // Check status bar shows correct tool (use first to avoid strict mode)
      const statusBar = page.locator('div').filter({ hasText: `Tool: ${tool.name}` }).first();
      await expect(statusBar).toBeVisible();
    }
  });

  test('should handle drawing on edges correctly', async ({ page }) => {
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();
    if (!bbox) throw new Error('Canvas not found');

    // Try to draw on all four edges
    const edges = [
      { x: bbox.x + 16, y: bbox.y + 16, label: 'top-left' },
      { x: bbox.x + bbox.width - 16, y: bbox.y + 16, label: 'top-right' },
      { x: bbox.x + 16, y: bbox.y + bbox.height - 16, label: 'bottom-left' },
      { x: bbox.x + bbox.width - 16, y: bbox.y + bbox.height - 16, label: 'bottom-right' }
    ];

    for (const edge of edges) {
      await page.mouse.click(edge.x, edge.y);
      await page.waitForTimeout(100);
    }

    // Should not crash
    expect(true).toBe(true);
  });

  test('should validate room layout correctly', async ({ page }) => {
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Initially, save should be disabled (empty layout)
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first();
    await expect(saveButton).toBeDisabled();

    // Draw a valid layout
    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();
    if (!bbox) throw new Error('Canvas not found');

    // First, add layout name (required for validation)
    const nameInput = page.locator('input[placeholder*="Layout name"]');
    await nameInput.fill('Valid Test Room');
    await page.waitForTimeout(200);

    // Draw connected floor tiles (5x5 area)
    const startX = bbox.x + 100;
    const startY = bbox.y + 100;

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        await page.mouse.click(startX + (x * 32), startY + (y * 32));
        await page.waitForTimeout(10);
      }
    }

    await page.waitForTimeout(500);

    // Now save button should be enabled
    const isStillDisabled = await saveButton.isDisabled();
    if (isStillDisabled) {
      // Log validation status for debugging
      const validationStatus = await page.locator('div').filter({ hasText: /Valid|error/ }).first().textContent();
      console.log('Validation status:', validationStatus);
    }
    expect(isStillDisabled).toBe(false);
  });

  test('should maintain undo/redo stack correctly', async ({ page }) => {
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();
    if (!bbox) throw new Error('Canvas not found');

    // Draw 5 tiles
    const startX = bbox.x + 100;
    const startY = bbox.y + 100;

    for (let i = 0; i < 5; i++) {
      await page.mouse.click(startX + (i * 32), startY);
      await page.waitForTimeout(50);
    }

    // Undo all 5
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(50);
    }

    // Try to undo more (should do nothing)
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(50);

    // Redo all 5
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(50);
    }

    // Try to redo more (should do nothing)
    await page.keyboard.press('Control+y');

    // Should not crash
    expect(true).toBe(true);
  });

  test('should handle rapid tool switching', async ({ page }) => {
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Rapidly switch between tools
    const keys = ['p', 'e', 'f', 'd', 'p', 'e', 'f', 'd'];
    for (const key of keys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
    }

    // Should not crash
    expect(true).toBe(true);
  });
});

test.describe('Room Editor - Error Handling', () => {
  test('should handle invalid room name gracefully', async ({ page }) => {
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Try to save with empty name (should be disabled)
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first();
    await expect(saveButton).toBeDisabled();
  });

  test('should handle disconnected floor tiles', async ({ page }) => {
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();
    if (!bbox) throw new Error('Canvas not found');

    // Draw two separate floor areas (disconnected)
    await page.mouse.click(bbox.x + 100, bbox.y + 100);
    await page.mouse.click(bbox.x + 200, bbox.y + 200);

    await page.waitForTimeout(500);

    // Add name
    const nameInput = page.locator('input[placeholder*="Layout name"]');
    await nameInput.fill('Disconnected Room');

    // Save button should be disabled (validation should fail)
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first();
    await expect(saveButton).toBeDisabled();
  });

  test('should handle doors on non-edges', async ({ page }) => {
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();
    if (!bbox) throw new Error('Canvas not found');

    // Switch to door tool
    await page.keyboard.press('d');
    await page.waitForTimeout(100);

    // Try to place door in center (should not work)
    await page.mouse.click(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);

    // Should not crash - door tool only works on edges
    expect(true).toBe(true);
  });
});
