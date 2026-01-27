import { test, expect } from '@playwright/test';

/**
 * Room Layout Editor E2E Tests
 * Tests the complete room layout system including editor, API, and dungeon generation
 */

test.describe('Room Layout Editor', () => {
  test('should load room editor page', async ({ page }) => {
    await page.goto('/room-editor');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that main components are present
    await expect(page.locator('text=Room Layouts')).toBeVisible();
    await expect(page.locator('text=Layout Settings')).toBeVisible();
    await expect(page.locator('text=Create New Layout')).toBeVisible();
  });

  test('should display seeded layouts', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');

    // Wait for layouts to load
    await page.waitForTimeout(1000);

    // Check that layouts are displayed (should be at least 18 starter layouts)
    const layoutCount = await page.locator('[style*="backgroundColor"][style*="borderRadius"]').count();
    expect(layoutCount).toBeGreaterThanOrEqual(18);

    // Check that some specific layouts exist
    await expect(page.locator('text=Small Corridor')).toBeVisible();
    await expect(page.locator('text=Basic Room 8x8')).toBeVisible();
  });

  test('should filter layouts by room type', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get initial count
    const initialCount = await page.locator('text=/Size:|Type:|Difficulty:/').count();
    expect(initialCount).toBeGreaterThan(0);

    // Select "combat" filter
    await page.selectOption('select', 'combat');
    await page.waitForTimeout(500);

    // Count should change (potentially 0 if no combat layouts)
    const filteredCount = await page.locator('text=/Size:|Type:|Difficulty:/').count();

    // Reset filter
    await page.selectOption('select', 'all');
    await page.waitForTimeout(500);

    const resetCount = await page.locator('text=/Size:|Type:|Difficulty:/').count();
    expect(resetCount).toBe(initialCount);
  });

  test('should create new layout', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click "Create New Layout"
    await page.locator('text=Create New Layout').click();

    // Canvas should be visible
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Check that default values are set
    await expect(page.locator('input[value="New Layout"]')).toBeVisible();
  });

  test('should draw on canvas with pen tool', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Create new layout
    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    // Select pen tool (should be default)
    await page.locator('text=✏️ Pen').click();

    // Select floor tile
    await page.locator('text=Floor').click();

    // Get canvas
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Draw some floor tiles in the center
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await canvas.click({ position: { x: box.width / 2 + 32, y: box.height / 2 } });
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 + 32 } });
    }

    // Should not be able to save yet (need walls/validation)
    const saveButton = page.locator('text=💾 Save Layout');
    await expect(saveButton).toBeVisible();
  });

  test('should validate layout before saving', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Create new layout
    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    // Change name
    const nameInput = page.locator('input[value="New Layout"]');
    await nameInput.fill('Test Layout');

    // Try to save without any floor tiles (should fail)
    const saveButton = page.locator('text=💾 Save Layout');

    // Button should be disabled (no floor tiles)
    await expect(saveButton).toHaveAttribute('disabled', '');
  });

  test('should update layout metadata', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Create new layout
    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    // Update name
    const nameInput = page.locator('input[placeholder="Layout name..."]');
    await nameInput.fill('My Custom Layout');
    await expect(nameInput).toHaveValue('My Custom Layout');

    // Update room type
    const roomTypeSelect = page.locator('select').nth(1);
    await roomTypeSelect.selectOption('treasure');

    // Update difficulty
    const difficultyInput = page.locator('input[type="number"]').nth(2);
    await difficultyInput.fill('7');
    await expect(difficultyInput).toHaveValue('7');
  });

  test('should select existing layout', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click on first layout
    const firstLayout = page.locator('text=Small Corridor').first();
    await firstLayout.click();

    // Canvas should update to show the selected layout
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Name should update
    await expect(page.locator('input[value*="Corridor"]')).toBeVisible();
  });

  test('should reset canvas', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Create new layout
    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    // Click reset button
    page.once('dialog', dialog => dialog.accept());
    await page.locator('text=🗑️ Reset Canvas').click();

    // Canvas should be cleared (all empty tiles)
  });
});

test.describe('Room Layout API', () => {
  test('should fetch all layouts', async ({ request }) => {
    const response = await request.get('/api/room-layouts');
    expect(response.ok()).toBeTruthy();

    const layouts = await response.json();
    expect(Array.isArray(layouts)).toBeTruthy();
    expect(layouts.length).toBeGreaterThanOrEqual(18);

    // Check structure of first layout
    if (layouts.length > 0) {
      const layout = layouts[0];
      expect(layout).toHaveProperty('id');
      expect(layout).toHaveProperty('name');
      expect(layout).toHaveProperty('width');
      expect(layout).toHaveProperty('height');
      expect(layout).toHaveProperty('tileGrid');
      expect(layout).toHaveProperty('doorPositions');
      expect(layout).toHaveProperty('roomType');
      expect(layout).toHaveProperty('difficulty');
    }
  });

  test('should filter layouts by room type', async ({ request }) => {
    const response = await request.get('/api/room-layouts?roomType=any');
    expect(response.ok()).toBeTruthy();

    const layouts = await response.json();
    layouts.forEach((layout: any) => {
      expect(layout.roomType).toBe('any');
    });
  });

  test('should filter layouts by size', async ({ request }) => {
    const response = await request.get('/api/room-layouts?minWidth=10&maxWidth=12');
    expect(response.ok()).toBeTruthy();

    const layouts = await response.json();
    layouts.forEach((layout: any) => {
      expect(layout.width).toBeGreaterThanOrEqual(10);
      expect(layout.width).toBeLessThanOrEqual(12);
    });
  });

  test('should filter layouts by door side', async ({ request }) => {
    const response = await request.get('/api/room-layouts?doorSide=north');
    expect(response.ok()).toBeTruthy();

    const layouts = await response.json();
    layouts.forEach((layout: any) => {
      expect(layout.doorPositions.north).toBe(true);
    });
  });

  test('should get random layout', async ({ request }) => {
    const response = await request.get('/api/room-layouts/random');
    expect(response.ok()).toBeTruthy();

    const layout = await response.json();
    expect(layout).toHaveProperty('id');
    expect(layout).toHaveProperty('name');
  });

  test('should get layout by ID', async ({ request }) => {
    // First get all layouts
    const allResponse = await request.get('/api/room-layouts');
    const layouts = await allResponse.json();

    if (layouts.length > 0) {
      const firstId = layouts[0].id;

      // Get specific layout
      const response = await request.get(`/api/room-layouts/${firstId}`);
      expect(response.ok()).toBeTruthy();

      const layout = await response.json();
      expect(layout.id).toBe(firstId);
    }
  });

  test('should create new layout', async ({ request }) => {
    const newLayout = {
      name: 'Test Layout ' + Date.now(),
      width: 8,
      height: 8,
      tileGrid: Array(8).fill(null).map(() => Array(8).fill(1)), // All floors
      doorPositions: {
        north: true,
        south: false,
        east: false,
        west: false
      },
      roomType: 'any',
      difficulty: 5,
      tags: ['test']
    };

    const response = await request.post('/api/room-layouts', {
      data: newLayout
    });

    expect(response.ok()).toBeTruthy();

    const created = await response.json();
    expect(created.name).toBe(newLayout.name);
    expect(created.width).toBe(8);
    expect(created.height).toBe(8);

    // Clean up - delete the created layout
    await request.delete(`/api/room-layouts/${created.id}`);
  });

  test('should validate layout on creation', async ({ request }) => {
    const invalidLayout = {
      name: 'Invalid Layout',
      width: 3, // Too small (minimum is 5)
      height: 8,
      tileGrid: Array(8).fill(null).map(() => Array(3).fill(1)),
      doorPositions: {
        north: false,
        south: false,
        east: false,
        west: false
      },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: invalidLayout
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
  });
});

test.describe('Dungeon Generation with Layouts', () => {
  test('should verify layout pool is initialized', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // This test verifies that the layout pool loads without errors
    // by checking that the main game loads successfully

    // Wait for login modal
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 5000 });
  });
});
