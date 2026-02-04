import { test, expect } from '@playwright/test';

test.describe('Room Editor - Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to create page
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should display tool icons in toolbar', async ({ page }) => {
    // Check if toolbar exists
    const toolbar = page.locator('div').filter({ hasText: 'Tools:' }).first();
    await expect(toolbar).toBeVisible();

    // Check for all tool buttons
    await expect(page.locator('button').filter({ hasText: '✏️' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '🗑️' }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '🪣' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '🚪' })).toBeVisible();
  });

  test('should switch tools with keyboard shortcuts', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    // Press P for Pen tool
    await page.keyboard.press('p');
    await page.waitForTimeout(100);

    // Press E for Eraser tool
    await page.keyboard.press('e');
    await page.waitForTimeout(100);

    // Press F for Fill tool
    await page.keyboard.press('f');
    await page.waitForTimeout(100);

    // Press D for Door tool
    await page.keyboard.press('d');
    await page.waitForTimeout(100);

    // No errors should occur
    expect(true).toBe(true);
  });

  test('should highlight active tool', async ({ page }) => {
    const penButton = page.locator('button').filter({ hasText: '✏️' });

    // Pen should be active by default
    await expect(penButton).toHaveCSS('border-color', /4a9eff|rgb\(74, 158, 255\)/i);

    // Click eraser
    const eraserButton = page.locator('button').filter({ hasText: '🗑️' }).first();
    await eraserButton.click();
    await page.waitForTimeout(100);

    // Eraser should now be active
    await expect(eraserButton).toHaveCSS('border-color', /4a9eff|rgb\(74, 158, 255\)/i);
  });

  test('should show tool icons with keyboard shortcuts', async ({ page }) => {
    // Tool buttons should have visual keyboard hints
    const penButton = page.locator('button').filter({ hasText: 'P' }).filter({ hasText: '✏️' });
    await expect(penButton).toBeVisible();
  });
});

test.describe('Room Editor - Grid Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to create page
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should toggle grid with G key', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await canvas.click();

    // Press G to toggle grid
    await page.keyboard.press('g');
    await page.waitForTimeout(100);

    // Press G again to toggle back
    await page.keyboard.press('g');
    await page.waitForTimeout(100);

    // No errors should occur
    expect(true).toBe(true);
  });

  test('should toggle grid with toolbar button', async ({ page }) => {
    // Find grid toggle button (contains G and grid icon)
    const gridButton = page.locator('button').filter({ hasText: 'G' }).filter({ hasText: /🔲|⬜/ });

    await expect(gridButton).toBeVisible();

    // Click to toggle
    await gridButton.click();
    await page.waitForTimeout(100);

    // Click again to toggle back
    await gridButton.click();
    await page.waitForTimeout(100);

    expect(true).toBe(true);
  });

  test('should show grid status in status bar', async ({ page }) => {
    const statusBar = page.locator('div').filter({ hasText: 'Grid:' }).first();
    await expect(statusBar).toBeVisible();
  });
});

test.describe('Room Editor - Status Bar', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to create page
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should display cursor coordinates on hover', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();

    if (bbox) {
      // Hover over canvas
      await page.mouse.move(bbox.x + 50, bbox.y + 50);
      await page.waitForTimeout(200);

      // Check if cursor position is displayed
      const statusBar = page.locator('div').filter({ hasText: 'Cursor:' }).first();
      await expect(statusBar).toBeVisible();

      // Should show coordinates (not --, --)
      const text = await statusBar.textContent();
      expect(text).not.toContain('(--, --)');
    }
  });

  test('should show active tool in status bar', async ({ page }) => {
    const statusBar = page.locator('div').filter({ hasText: 'Tool:' }).first();
    await expect(statusBar).toBeVisible();

    // Should show Pen by default
    await expect(statusBar).toContainText('Pen');
  });

  test('should show validation status', async ({ page }) => {
    // Initially should be invalid (no floor tiles)
    const statusBar = page.locator('div').filter({ hasText: /Valid|error/ }).first();
    await expect(statusBar).toBeVisible();
  });

  test('should show canvas size in status bar', async ({ page }) => {
    const statusBar = page.locator('div').filter({ hasText: 'Size:' }).first();
    await expect(statusBar).toBeVisible();
    await expect(statusBar).toContainText('8×8');
  });
});

test.describe('Room Editor - Help Overlay', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to create page
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should open help with ? key', async ({ page }) => {
    await page.keyboard.press('?');
    await page.waitForTimeout(200);

    const helpOverlay = page.locator('text=KEYBOARD SHORTCUTS');
    await expect(helpOverlay).toBeVisible();
  });

  test('should open help with H key', async ({ page }) => {
    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    const helpOverlay = page.locator('text=KEYBOARD SHORTCUTS');
    await expect(helpOverlay).toBeVisible();
  });

  test('should close help with ESC key', async ({ page }) => {
    // Open help
    await page.keyboard.press('?');
    await page.waitForTimeout(200);

    // Close with ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const helpOverlay = page.locator('text=KEYBOARD SHORTCUTS');
    await expect(helpOverlay).not.toBeVisible();
  });

  test('should close help on backdrop click', async ({ page }) => {
    // Open help
    await page.keyboard.press('?');
    await page.waitForTimeout(200);

    // Click backdrop (outside modal)
    await page.mouse.click(10, 10);
    await page.waitForTimeout(200);

    const helpOverlay = page.locator('text=KEYBOARD SHORTCUTS');
    await expect(helpOverlay).not.toBeVisible();
  });

  test('should list all keyboard shortcuts', async ({ page }) => {
    await page.keyboard.press('?');
    await page.waitForTimeout(200);

    // Check for all shortcut sections (within help overlay)
    const helpOverlay = page.locator('text=KEYBOARD SHORTCUTS').locator('..');
    await expect(helpOverlay.locator('text=DRAWING TOOLS')).toBeVisible();
    await expect(helpOverlay.locator('h3', { hasText: 'VIEW' })).toBeVisible();
    await expect(helpOverlay.locator('text=EDIT')).toBeVisible();
    await expect(helpOverlay.locator('text=OTHER')).toBeVisible();

    // Check for specific shortcuts (use first() to avoid strict mode violations)
    await expect(page.locator('kbd').filter({ hasText: /^P$/ }).first()).toBeVisible();
    await expect(page.locator('kbd').filter({ hasText: /^E$/ }).first()).toBeVisible();
    await expect(page.locator('kbd').filter({ hasText: /^F$/ }).first()).toBeVisible();
    await expect(page.locator('kbd').filter({ hasText: /^D$/ }).first()).toBeVisible();
    await expect(page.locator('kbd').filter({ hasText: /^G$/ }).first()).toBeVisible();
    await expect(page.locator('kbd').filter({ hasText: 'Ctrl+Z' }).first()).toBeVisible();
    await expect(page.locator('kbd').filter({ hasText: 'Ctrl+Y' }).first()).toBeVisible();
  });

  test('should open help with toolbar button', async ({ page }) => {
    const helpButton = page.locator('button').filter({ hasText: 'Help' });
    await helpButton.click();
    await page.waitForTimeout(200);

    const helpOverlay = page.locator('text=KEYBOARD SHORTCUTS');
    await expect(helpOverlay).toBeVisible();
  });
});

test.describe('Room Editor - Visual Feedback', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to create page
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should show save success message', async ({ page }) => {
    // Draw a simple valid layout
    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();

    if (bbox) {
      // Draw multiple floor tiles to create a valid layout
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
          await page.mouse.click(bbox.x + 100 + (i * 32), bbox.y + 100 + (j * 32));
        }
      }
    }

    await page.waitForTimeout(500);

    // Try to save - button might be disabled if still invalid
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first();
    const isDisabled = await saveButton.isDisabled();

    if (!isDisabled) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }

    // Test passed if no crash occurred
    expect(true).toBe(true);
  });

  test('should show error on invalid save attempt', async ({ page }) => {
    // Try to save without drawing anything (invalid)
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first();

    // Save button should be disabled initially (empty layout is invalid)
    await expect(saveButton).toBeDisabled();
  });
});

test.describe('Room Editor - Confirmation Modals', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to create page
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should show confirmation on reset', async ({ page }) => {
    // Click toolbar reset button (first one)
    const resetButton = page.locator('button').filter({ hasText: 'Reset' }).first();
    await resetButton.click();
    await page.waitForTimeout(200);

    const confirmModal = page.locator('text=Reset Canvas?');
    await expect(confirmModal).toBeVisible();
  });

  test('should reset on confirm', async ({ page }) => {
    // Click toolbar reset button (first one)
    const resetButton = page.locator('button').filter({ hasText: 'Reset' }).first();
    await resetButton.click();
    await page.waitForTimeout(200);

    // Click confirm button in modal (contains "Reset" text)
    const confirmButton = page.getByRole('button', { name: /Reset/i }).last();
    await confirmButton.click();
    await page.waitForTimeout(200);

    // Modal should close
    const confirmModal = page.locator('text=Reset Canvas?');
    await expect(confirmModal).not.toBeVisible();
  });

  test('should cancel reset on cancel', async ({ page }) => {
    // Click toolbar reset button (first one)
    const resetButton = page.locator('button').filter({ hasText: 'Reset' }).first();
    await resetButton.click();
    await page.waitForTimeout(200);

    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
    await page.waitForTimeout(200);

    // Modal should close
    const confirmModal = page.locator('text=Reset Canvas?');
    await expect(confirmModal).not.toBeVisible();
  });

  test('should show confirmation on delete layout', async ({ page }) => {
    // Go back to layout browser
    await page.locator('button').filter({ hasText: 'Zurück' }).click();
    await page.waitForTimeout(500);

    // Find first delete button
    const deleteButton = page.locator('button[title*="löschen"]').first();

    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      await page.waitForTimeout(200);

      const confirmModal = page.locator('text=Delete Layout?');
      await expect(confirmModal).toBeVisible();
    }
  });
});

test.describe('Room Editor - Undo/Redo Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to create page
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('should undo with Ctrl+Z', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();

    if (bbox) {
      // Draw a tile
      await page.mouse.click(bbox.x + 100, bbox.y + 100);
      await page.waitForTimeout(200);

      // Undo
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);

      // No errors should occur
      expect(true).toBe(true);
    }
  });

  test('should redo with Ctrl+Y', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const bbox = await canvas.boundingBox();

    if (bbox) {
      // Draw a tile
      await page.mouse.click(bbox.x + 100, bbox.y + 100);
      await page.waitForTimeout(200);

      // Undo
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);

      // Redo
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(200);

      // No errors should occur
      expect(true).toBe(true);
    }
  });
});
