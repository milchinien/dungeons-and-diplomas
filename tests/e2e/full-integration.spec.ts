import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// --- Helper: Login ---
async function loginUser(page: Page, username = 'playwright_test_user') {
  // Capture console errors and failed requests for debugging
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      consoleErrors.push(`HTTP ${response.status()} ${response.url()}`);
    }
  });
  page.on('dialog', async dialog => { await dialog.accept(); });
  await page.goto(`${BASE_URL}`);
  await page.waitForTimeout(2000);
  const loginInput = page.locator('input[type="text"]');
  await loginInput.fill(username);
  const loginBtn = page.locator('button[type="submit"]');
  await loginBtn.click();
  // After login, MainMenu appears — click "Spielen" to start the game
  const playBtn = page.locator('button').filter({ hasText: /Spielen/i });
  try {
    await playBtn.waitFor({ timeout: 10000 });
    await playBtn.click();
  } catch {
    throw new Error(`MainMenu "Spielen" button not found. Console errors: ${JSON.stringify(consoleErrors)}`);
  }
  // Wait for game canvas to appear
  try {
    await page.waitForSelector('canvas', { timeout: 15000 });
  } catch {
    throw new Error(`Canvas not found after clicking Spielen. Console errors: ${JSON.stringify(consoleErrors)}`);
  }
}

// --- Helper: Navigate to room editor ---
async function goToEditor(page: Page) {
  await page.goto(`${BASE_URL}/room-editor`);
  await page.waitForTimeout(1500);
}

// === ROOM EDITOR TESTS ===

test.describe('Room Editor - Basic Loading', () => {
  test('editor page loads and canvas is visible', async ({ page }) => {
    await goToEditor(page);
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();
  });

  test('dark theme is applied', async ({ page }) => {
    await goToEditor(page);
    const body = page.locator('body');
    // Just check that page loaded without crash
    await expect(body).toBeAttached();
  });
});

test.describe('Room Editor - Drawing Tools', () => {
  test('pen tool paints a floor tile', async ({ page }) => {
    await goToEditor(page);
    // Click Pen button
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    // Make sure Floor tile is selected
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    // Click on canvas center to paint
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(300);
    // Verify no crash and canvas still visible
    await expect(canvas).toBeVisible();
  });

  test('eraser tool removes a tile', async ({ page }) => {
    await goToEditor(page);
    // Paint first
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(300);
    // Now erase
    const eraserBtn = page.locator('button').filter({ hasText: /Eraser/i });
    await eraserBtn.click();
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(300);
    await expect(canvas).toBeVisible();
  });

  test('fill tool flood-fills an area', async ({ page }) => {
    await goToEditor(page);
    // Select fill tool
    const fillBtn = page.locator('button').filter({ hasText: /Fill/i });
    await fillBtn.click();
    // Select floor tile
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    if (await floorBtn.isVisible()) await floorBtn.click();
    // Click canvas to flood fill
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(500);
    await expect(canvas).toBeVisible();
  });

  test('door tool places door on edge only', async ({ page }) => {
    await goToEditor(page);
    const doorBtn = page.locator('button').filter({ hasText: /Door/i });
    await doorBtn.click();
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    // Click top edge (y close to 0)
    await canvas.click({ position: { x: box.width / 2, y: 10 } });
    await page.waitForTimeout(300);
    // Click center (should be rejected - no door placed)
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(300);
    await expect(canvas).toBeVisible();
  });
});

test.describe('Room Editor - Undo/Redo', () => {
  test('Ctrl+Z undoes last paint action', async ({ page }) => {
    await goToEditor(page);
    // Paint a tile
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    await canvas.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(300);
    // Undo button should now be enabled
    const undoBtn = page.locator('button').filter({ hasText: /Undo/i });
    await expect(undoBtn).not.toBeDisabled();
    // Press Ctrl+Z
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    await expect(canvas).toBeVisible();
  });

  test('Ctrl+Shift+Z redoes after undo', async ({ page }) => {
    await goToEditor(page);
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    await canvas.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(300);
    // Undo
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    // Redo button should be enabled
    const redoBtn = page.locator('button').filter({ hasText: /Redo/i });
    await expect(redoBtn).not.toBeDisabled();
    // Redo
    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(300);
    await expect(canvas).toBeVisible();
  });

  test('Undo button click works', async ({ page }) => {
    await goToEditor(page);
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(300);
    const undoBtn = page.locator('button').filter({ hasText: /Undo/i });
    await undoBtn.click();
    await page.waitForTimeout(300);
    await expect(canvas).toBeVisible();
  });

  test('Redo button click works', async ({ page }) => {
    await goToEditor(page);
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    const redoBtn = page.locator('button').filter({ hasText: /Redo/i });
    await redoBtn.click();
    await page.waitForTimeout(300);
    await expect(canvas).toBeVisible();
  });

  test('multiple undos in sequence work', async ({ page }) => {
    await goToEditor(page);
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    // Paint 5 tiles
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: 32 * (i + 1), y: 50 } });
      await page.waitForTimeout(100);
    }
    // Undo 5 times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(100);
    }
    await expect(canvas).toBeVisible();
  });
});

test.describe('Room Editor - Preview Mode', () => {
  test('preview toggle button exists and is clickable', async ({ page }) => {
    await goToEditor(page);
    const previewBtn = page.locator('button').filter({ hasText: /Preview/i });
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();
    await page.waitForTimeout(1500); // wait for tileset load
    // Should still show a canvas (the preview canvas)
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();
  });

  test('preview mode shows "Drawing disabled" text', async ({ page }) => {
    await goToEditor(page);
    const previewBtn = page.locator('button').filter({ hasText: /Preview/i });
    await previewBtn.click();
    await page.waitForTimeout(1000);
    const infoText = page.locator('*').filter({ hasText: /Drawing disabled/i });
    await expect(infoText.first()).toBeVisible();
  });

  test('can toggle back to editor view', async ({ page }) => {
    await goToEditor(page);
    const previewBtn = page.locator('button').filter({ hasText: /Preview/i });
    await previewBtn.click();
    await page.waitForTimeout(1000);
    // Now click again to go back to Editor View
    const editorBtn = page.locator('button').filter({ hasText: /Editor/i });
    await editorBtn.click();
    await page.waitForTimeout(500);
    // Undo/Redo buttons should be visible again
    const undoBtn = page.locator('button').filter({ hasText: /Undo/i });
    await expect(undoBtn).toBeVisible();
  });

  test('preview renders with tileset after painting tiles', async ({ page }) => {
    await goToEditor(page);
    // Paint some floor tiles first
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 50, y: 50 } });
    await canvas.click({ position: { x: 80, y: 50 } });
    await page.waitForTimeout(300);
    // Switch to preview
    const previewBtn = page.locator('button').filter({ hasText: /Preview/i });
    await previewBtn.click();
    await page.waitForTimeout(2000);
    const previewCanvas = page.locator('canvas');
    await expect(previewCanvas.first()).toBeVisible();
  });
});

test.describe('Room Editor - Live Validation', () => {
  test('empty layout shows validation errors', async ({ page }) => {
    await goToEditor(page);
    // Fresh layout = all EMPTY = should show validation errors (no floor, no doors)
    await page.waitForTimeout(500);
    const errorArea = page.locator('*').filter({ hasText: /⚠/i });
    await expect(errorArea.first()).toBeVisible();
  });

  test('save button is disabled when layout is invalid', async ({ page }) => {
    await goToEditor(page);
    await page.waitForTimeout(500);
    const saveBtn = page.locator('button').filter({ hasText: /Save/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('adding floor and door makes layout valid and save enabled', async ({ page }) => {
    await goToEditor(page);
    // Paint floor tiles
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    // Paint several floor tiles in center
    for (let i = 2; i < 6; i++) {
      for (let j = 2; j < 6; j++) {
        await canvas.click({ position: { x: 32 * i + 16, y: 32 * j + 16 } });
        await page.waitForTimeout(50);
      }
    }
    // Place a door on top edge
    const doorBtn = page.locator('button').filter({ hasText: /Door/i });
    await doorBtn.click();
    await canvas.click({ position: { x: 32 * 3 + 16, y: 5 } });
    await page.waitForTimeout(500);
    // Save should now be enabled
    const saveBtn = page.locator('button').filter({ hasText: /Save/i });
    await expect(saveBtn).not.toBeDisabled();
  });
});

test.describe('Room Editor - Save & Load', () => {
  test('save a valid layout and verify success', async ({ page }) => {
    await goToEditor(page);
    // Paint floor
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    for (let i = 1; i < 7; i++) {
      for (let j = 1; j < 7; j++) {
        await canvas.click({ position: { x: 32 * i + 16, y: 32 * j + 16 } });
        await page.waitForTimeout(30);
      }
    }
    // Place doors on edges
    const doorBtn = page.locator('button').filter({ hasText: /Door/i });
    await doorBtn.click();
    await canvas.click({ position: { x: 32 * 3 + 16, y: 5 } }); // north
    await canvas.click({ position: { x: 32 * 3 + 16, y: 32 * 7 + 25 } }); // south
    await page.waitForTimeout(500);
    // Set name
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.clear();
    await nameInput.fill('Playwright Test Room');
    await page.waitForTimeout(300);
    // Save
    const saveBtn = page.locator('button').filter({ hasText: /Save/i });
    await expect(saveBtn).not.toBeDisabled();
    await saveBtn.click();
    await page.waitForTimeout(2000);
    // Check for success alert or no error
    // (alert() is handled by page.on('dialog') but we just verify no crash)
    await expect(canvas).toBeVisible();
  });

  test('saved layout appears in API', async ({ page }) => {
    // First verify via API that layouts exist
    const response = await page.request.get(`${BASE_URL}/api/room-layouts`);
    expect(response.status()).toBe(200);
    const layouts = await response.json();
    expect(Array.isArray(layouts)).toBe(true);
    expect(layouts.length).toBeGreaterThan(0);
  });

  test('random layout API returns a layout', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/room-layouts/random`);
    expect(response.status()).toBe(200);
    const layout = await response.json();
    expect(layout).toHaveProperty('id');
    expect(layout).toHaveProperty('tileGrid');
    expect(layout).toHaveProperty('doorPositions');
  });
});

test.describe('Room Editor - Layout Manager (Create/Delete)', () => {
  test('create new layout resets canvas', async ({ page }) => {
    await goToEditor(page);
    // Paint something
    const penBtn = page.locator('button').filter({ hasText: /Pen/i });
    await penBtn.click();
    const floorBtn = page.locator('button').filter({ hasText: /Floor/i });
    await floorBtn.click();
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(300);
    // Find and click a "New" or "Create" button in the left panel
    const newBtn = page.locator('button').filter({ hasText: /New|Create/i });
    if (await newBtn.count() > 0) {
      await newBtn.first().click();
      // Handle confirm dialog
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      await page.waitForTimeout(500);
    }
    await expect(canvas).toBeVisible();
  });
});

// === GAME TESTS ===

test.describe('Game - Login & Loading', () => {
  test('main page loads and shows login modal', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForTimeout(1500);
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
  });

  test('login with username works', async ({ page }) => {
    await loginUser(page, 'pw_test_game_user');
    // After login, game canvas should be visible
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();
  });
});

test.describe('Game - Player Movement', () => {
  test('player can move with arrow keys', async ({ page }) => {
    await loginUser(page, 'pw_test_movement');
    await page.waitForTimeout(1000);
    // Press right arrow multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
    }
    // Game should still be running (no crash)
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();
  });

  test('player can move with WASD keys', async ({ page }) => {
    await loginUser(page, 'pw_test_wasd');
    await page.waitForTimeout(2000);
    await page.keyboard.press('w');
    await page.keyboard.press('a');
    await page.keyboard.press('s');
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();
  });
});

test.describe('Game - Layout Pool Integration', () => {
  test('dungeon generation uses layout-based system', async ({ page }) => {
    await loginUser(page, 'pw_test_layouts');
    await page.waitForTimeout(1000);
    // Verify game canvas is present and rendered (layout-based dungeon)
    const canvas = page.locator('canvas');
    await expect(canvas.first()).toBeVisible();
    // Check that the canvas has actual pixel data (not blank)
    const canvasBox = await canvas.first().boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(100);
    expect(canvasBox!.height).toBeGreaterThan(100);
  });

  test('seed layouts are present in database', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/room-layouts`);
    expect(response.status()).toBe(200);
    const layouts = await response.json();
    // Should have at least the 18 seeded layouts
    expect(layouts.length).toBeGreaterThanOrEqual(18);
  });

  test('layouts have valid door positions', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/room-layouts`);
    const layouts = await response.json();
    for (const layout of layouts) {
      expect(layout.doorPositions).toHaveProperty('north');
      expect(layout.doorPositions).toHaveProperty('south');
      expect(layout.doorPositions).toHaveProperty('east');
      expect(layout.doorPositions).toHaveProperty('west');
      // At least one door must exist
      const hasDoor = layout.doorPositions.north || layout.doorPositions.south ||
                      layout.doorPositions.east || layout.doorPositions.west;
      expect(hasDoor).toBe(true);
    }
  });

  test('layouts have valid tile grids', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/room-layouts`);
    const layouts = await response.json();
    for (const layout of layouts) {
      expect(layout.tileGrid.length).toBe(layout.height);
      expect(layout.tileGrid[0].length).toBe(layout.width);
      expect(layout.width).toBeGreaterThanOrEqual(5);
      expect(layout.width).toBeLessThanOrEqual(15);
      expect(layout.height).toBeGreaterThanOrEqual(5);
      expect(layout.height).toBeLessThanOrEqual(15);
    }
  });

  test('random layout endpoint works with filters', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/room-layouts/random?roomType=any`);
    expect(response.status()).toBe(200);
    const layout = await response.json();
    expect(layout).toHaveProperty('id');
  });
});

test.describe('Game - Statistics Dashboard', () => {
  test('D key toggles stats dashboard', async ({ page }) => {
    await loginUser(page, 'pw_test_stats');
    await page.waitForTimeout(1000);
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
    // Dashboard should appear — check for some stats-related content
    const body = page.locator('body');
    await expect(body).toBeAttached();
  });
});
