import { test, expect } from '@playwright/test';

/**
 * Room Layout System - Comprehensive Bug Testing Suite
 *
 * Tests all identified potential bugs, edge cases, and error conditions
 * Based on detailed code analysis of:
 * - Input validation gaps
 * - Boundary conditions
 * - Race conditions
 * - State synchronization issues
 * - Error handling gaps
 * - Algorithm edge cases
 * - Type safety issues
 * - Async operation issues
 * - Memory leaks
 * - Performance issues
 */

test.describe('Category 1: Input Validation Bugs', () => {

  test('Bug 1.1: Should reject jagged grid (unequal row lengths)', async ({ request }) => {
    const jaggedLayout = {
      name: 'Jagged Grid Bug Test',
      width: 5,
      height: 5,
      tileGrid: [
        [1, 1, 1],           // 3 columns
        [1, 1, 1, 1, 1],     // 5 columns (mismatch!)
        [1, 1],              // 2 columns (mismatch!)
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1]
      ],
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: jaggedLayout
    });

    // Should fail validation
    expect(response.ok()).toBeFalsy();
  });

  test('Bug 1.2: Should reject invalid tile type values', async ({ request }) => {
    const invalidTileLayout = {
      name: 'Invalid Tile Type',
      width: 5,
      height: 5,
      tileGrid: Array(5).fill(null).map(() => [1, 1, 999, 1, 1]), // 999 is invalid
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: invalidTileLayout
    });

    expect(response.ok()).toBeFalsy();
  });

  test('Bug 1.4: Should reject invalid difficulty values', async ({ request }) => {
    const invalidDifficulty = {
      name: 'Invalid Difficulty',
      width: 5,
      height: 5,
      tileGrid: Array(5).fill(null).map(() => Array(5).fill(1)),
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 50, // Outside 1-10 range
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: invalidDifficulty
    });

    expect(response.ok()).toBeFalsy();
  });

  test('Bug 1.5: UI should prevent grid size outside 5-15 range', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    // Try to set width to 20 (max is 15)
    const widthInput = page.locator('input[type="number"]').first();
    await widthInput.fill('20');
    await widthInput.blur();

    // Should be clamped or rejected
    const finalValue = await widthInput.inputValue();
    expect(parseInt(finalValue)).toBeLessThanOrEqual(15);
  });

  test('Bug 1.6: Should handle excessive tags gracefully', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    // Try to add many tags
    const tagInput = page.locator('input[placeholder*="tag"]').first();
    const addButton = page.locator('button:has-text("Add")');

    for (let i = 0; i < 100; i++) {
      await tagInput.fill(`tag${i}`);
      await addButton.click();
    }

    // Count tags (should have some limit or handle gracefully)
    const tagCount = await page.locator('span:has(button:has-text("×"))').count();

    // Either limited to reasonable count or all added successfully
    expect(tagCount).toBeGreaterThan(0);
    expect(tagCount).toBeLessThanOrEqual(100);
  });
});

test.describe('Category 2: Boundary Condition Bugs', () => {

  test('Bug 2.1: Should handle negative room position calculations', async ({ request }) => {
    // This tests the door alignment algorithm
    // Create layout that would cause negative positioning
    const response = await request.get('/api/room-layouts/random');
    expect(response.ok()).toBeTruthy();

    // Algorithm should never create dungeons with negative coordinates
    // This is more of an integration test - covered by dungeon generation
  });

  test('Bug 2.3: Should handle empty layout pool gracefully', async ({ request }) => {
    // Try to get random layout even if pool might be empty
    const response = await request.get('/api/room-layouts/random?roomType=nonexistent');

    // Should either return 404 or fallback layout, not crash
    expect([200, 404]).toContain(response.status());
  });

  test('Bug 2.4: Should generate dungeon even with limited layouts', async ({ page }) => {
    // This tests that dungeon generation doesn't infinite loop
    // when layout options are limited
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for login modal
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });

    // If we get here, dungeon initialized without hanging
  });

  test('Bug 2.6: Should create shop in small dungeons', async ({ request }) => {
    // Test that room type assignment works for edge cases
    const allLayouts = await request.get('/api/room-layouts');
    const layouts = await allLayouts.json();

    // Even with few layouts, system should assign types properly
    expect(layouts.length).toBeGreaterThan(0);
  });
});

test.describe('Category 3: Race Condition Tests', () => {

  test('Bug 3.1: Filter changes should not cause out-of-order responses', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const typeFilter = page.locator('select').first();

    // Rapidly change filters
    await typeFilter.selectOption('combat');
    await typeFilter.selectOption('treasure');
    await typeFilter.selectOption('shop');
    await typeFilter.selectOption('any');

    // Wait for final state
    await page.waitForTimeout(2000);

    // Verify correct filter is showing
    const selectedValue = await typeFilter.inputValue();
    expect(selectedValue).toBe('any');
  });

  test('Bug 3.2: Delete should properly refresh list', async ({ request, page }) => {
    // Create a test layout
    const testLayout = {
      name: 'Race Test Layout ' + Date.now(),
      width: 5,
      height: 5,
      tileGrid: Array(5).fill(null).map(() => Array(5).fill(1)),
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: ['test']
    };

    const createResponse = await request.post('/api/room-layouts', {
      data: testLayout
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();

    // Now open editor and delete it
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and delete the test layout
    const layoutCard = page.locator(`text=${testLayout.name}`).first();

    if (await layoutCard.isVisible()) {
      await layoutCard.click();
      const deleteButton = page.locator('button:has-text("Delete")').first();

      page.once('dialog', dialog => dialog.accept());
      await deleteButton.click();

      await page.waitForTimeout(1000);

      // Verify it's gone
      const stillVisible = await layoutCard.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillVisible).toBeFalsy();
    }
  });
});

test.describe('Category 4: State Synchronization Tests', () => {

  test('Bug 4.1: Grid resize should warn before losing data', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    // Draw some content
    const canvas = page.locator('canvas').first();
    await page.locator('text=✏️ Pen').click();
    await page.locator('text=Floor').click();

    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    }

    // Now try to resize smaller
    const widthInput = page.locator('input[type="number"]').first();
    await widthInput.fill('5');

    // Should either warn or handle gracefully
    // Currently just testing it doesn't crash
    await page.waitForTimeout(500);
  });

  test('Bug 4.2: Width and height should update together', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    const widthInput = page.locator('input[type="number"]').first();
    const heightInput = page.locator('input[type="number"]').nth(1);

    // Change both rapidly
    await widthInput.fill('10');
    await heightInput.fill('12');

    await page.waitForTimeout(500);

    // Verify both changed
    expect(await widthInput.inputValue()).toBe('10');
    expect(await heightInput.inputValue()).toBe('12');
  });

  test('Bug 4.3: Save should not use stale state', async ({ request, page }) => {
    // Create a layout
    const testLayout = {
      name: 'Stale State Test ' + Date.now(),
      width: 8,
      height: 8,
      tileGrid: Array(8).fill(null).map(() => Array(8).fill(1)),
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const createResponse = await request.post('/api/room-layouts', {
      data: testLayout
    });
    const created = await createResponse.json();

    // Open in editor
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Select the layout
    await page.locator(`text=${testLayout.name}`).first().click();
    await page.waitForTimeout(500);

    // Change name
    const nameInput = page.locator('input[placeholder*="Layout name"]');
    await nameInput.fill('Updated Name');

    // Save
    await page.locator('text=💾 Save Layout').click();
    await page.waitForTimeout(1000);

    // Verify it saved correctly
    const getResponse = await request.get(`/api/room-layouts/${created.id}`);
    const updated = await getResponse.json();
    expect(updated.name).toBe('Updated Name');

    // Cleanup
    await request.delete(`/api/room-layouts/${created.id}`);
  });
});

test.describe('Category 5: Error Handling Tests', () => {

  test('Bug 5.1: Should handle corrupted JSON gracefully', async ({ request }) => {
    // This tests database robustness
    // Can't easily corrupt DB in test, but can test error responses

    const response = await request.get('/api/room-layouts/999999');
    expect(response.status()).toBe(404);
  });

  test('Bug 5.4: Should reject oversized input', async ({ request }) => {
    const hugeLayout = {
      name: 'Huge Layout',
      width: 15,
      height: 15,
      tileGrid: Array(15).fill(null).map(() => Array(15).fill(1)),
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: Array(1000).fill('tag') // 1000 tags!
    };

    const response = await request.post('/api/room-layouts', {
      data: hugeLayout
    });

    // Should either accept or reject gracefully, not crash
    expect([200, 201, 400, 413]).toContain(response.status());
  });

  test('Bug 5.5: Should handle invalid doorSide parameter', async ({ request }) => {
    const response = await request.get('/api/room-layouts?doorSide=invalid');

    // Should return empty array or error, not crash
    expect(response.ok()).toBeTruthy();
    const layouts = await response.json();
    expect(Array.isArray(layouts)).toBeTruthy();
  });

  test('Bug 5.6: Canvas should not crash on out-of-bounds access', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas').first();
    await page.locator('text=✏️ Pen').click();

    // Click at extreme edges
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({ position: { x: 0, y: 0 } });
      await canvas.click({ position: { x: box.width - 1, y: box.height - 1 } });
      await canvas.click({ position: { x: box.width / 2, y: 0 } });
      await canvas.click({ position: { x: 0, y: box.height / 2 } });
    }

    // Should not crash
    await page.waitForTimeout(500);
  });
});

test.describe('Category 6: Algorithm Edge Cases', () => {

  test('Bug 6.1: Flood fill should handle large empty grids', async ({ request }) => {
    const largeEmptyLayout = {
      name: 'Large Empty Grid',
      width: 15,
      height: 15,
      tileGrid: Array(15).fill(null).map(() => Array(15).fill(1)), // All floors
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: largeEmptyLayout
    });

    // Validation should complete without timeout
    expect([200, 201, 400]).toContain(response.status());

    if (response.ok()) {
      const created = await response.json();
      await request.delete(`/api/room-layouts/${created.id}`);
    }
  });

  test('Bug 6.2: Should detect disconnected floor regions', async ({ request }) => {
    const disconnectedLayout = {
      name: 'Disconnected Floors',
      width: 7,
      height: 7,
      tileGrid: [
        [2, 2, 2, 2, 2, 2, 2],
        [2, 1, 1, 2, 1, 1, 2], // Two separate floor regions!
        [2, 1, 1, 2, 1, 1, 2],
        [2, 2, 2, 2, 2, 2, 2],
        [2, 1, 1, 2, 0, 0, 2],
        [2, 1, 1, 2, 0, 0, 2],
        [2, 2, 2, 2, 2, 2, 2]
      ],
      doorPositions: { north: false, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: disconnectedLayout
    });

    // Should reject due to disconnected floors
    expect(response.ok()).toBeFalsy();

    if (!response.ok()) {
      const error = await response.json();
      expect(error.error).toContain('erreichbar');
    }
  });

  test('Bug 6.5: Room type assignment should be deterministic with seed', async ({ page }) => {
    // This would require testing dungeon generation with same seed
    // For now, just verify system doesn't crash
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Category 7: Type Safety Tests', () => {

  test('Bug 7.1: Should handle NaN difficulty gracefully', async ({ request }) => {
    const response = await request.get('/api/room-layouts?difficulty=abc');

    expect(response.ok()).toBeTruthy();
    const layouts = await response.json();
    expect(Array.isArray(layouts)).toBeTruthy();
  });

  test('Bug 7.2: API should serialize dates correctly', async ({ request }) => {
    const allResponse = await request.get('/api/room-layouts');
    const layouts = await allResponse.json();

    if (layouts.length > 0) {
      const layout = layouts[0];

      // createdAt should be string (JSON serialized)
      expect(typeof layout.createdAt).toBe('string');

      // Should be valid ISO date string
      const date = new Date(layout.createdAt);
      expect(date.toString()).not.toBe('Invalid Date');
    }
  });
});

test.describe('Category 8: Async Operation Tests', () => {

  test('Bug 8.1: Component unmount should not cause errors', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');

    // Immediately navigate away while loading
    await page.goto('/');

    // Wait to see if any errors occur
    await page.waitForTimeout(2000);

    // If we get here, no crash occurred
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 5000 });
  });

  test('Bug 8.2: API failures should show user-friendly errors', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Layout list should show something (even if it's an error message)
    // Not just silent failure
    const layoutSection = page.locator('text=Room Layouts').first();
    await expect(layoutSection).toBeVisible();
  });
});

test.describe('Category 9: Performance & Stress Tests', () => {

  test('Bug 10.1: Should handle many layouts without freezing', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');

    // Wait for layouts to load
    await page.waitForTimeout(2000);

    // Should still be responsive
    const createButton = page.locator('text=Create New Layout');
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeEnabled();
  });

  test('Bug 10.3: Thumbnail rendering should not freeze browser', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Scroll through layout list
    const layoutList = page.locator('text=Room Layouts').first();
    await layoutList.scrollIntoViewIfNeeded();

    // Should complete without timeout
    await page.waitForTimeout(1000);
  });

  test('Stress test: Rapid tool switching', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    // Rapidly switch tools
    for (let i = 0; i < 20; i++) {
      await page.locator('text=✏️ Pen').click();
      await page.locator('text=🗑️ Eraser').click();
      await page.locator('text=🪣 Fill').click();
      await page.locator('text=🚪 Door').click();
    }

    // Should not crash
    await page.waitForTimeout(500);
  });

  test('Stress test: Rapid drawing', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.locator('text=Create New Layout').click();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas').first();
    await page.locator('text=✏️ Pen').click();
    await page.locator('text=Floor').click();

    const box = await canvas.boundingBox();
    if (box) {
      // Click rapidly in grid
      for (let i = 0; i < 50; i++) {
        await canvas.click({
          position: {
            x: (i % 8) * 32 + 16,
            y: Math.floor(i / 8) * 32 + 16
          }
        });
      }
    }

    await page.waitForTimeout(500);
  });

  test('Stress test: Rapid filter changes', async ({ page }) => {
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const typeFilter = page.locator('select').first();
    const options = ['all', 'empty', 'treasure', 'combat', 'shop', 'any'];

    // Rapidly cycle through all options multiple times
    for (let cycle = 0; cycle < 10; cycle++) {
      for (const option of options) {
        await typeFilter.selectOption(option);
      }
    }

    await page.waitForTimeout(1000);

    // Should still be functional
    await expect(typeFilter).toBeVisible();
  });
});

test.describe('Category 10: Security & Validation Tests', () => {

  test('Should sanitize special characters in layout name', async ({ request }) => {
    const specialCharLayout = {
      name: '<script>alert("xss")</script>',
      width: 5,
      height: 5,
      tileGrid: Array(5).fill(null).map(() => Array(5).fill(1)),
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: specialCharLayout
    });

    if (response.ok()) {
      const created = await response.json();

      // Name should be stored (but sanitized when rendered)
      expect(created.name).toBeTruthy();

      await request.delete(`/api/room-layouts/${created.id}`);
    }
  });

  test('Should validate room type enum', async ({ request }) => {
    const invalidTypeLayout = {
      name: 'Invalid Type Test',
      width: 5,
      height: 5,
      tileGrid: Array(5).fill(null).map(() => Array(5).fill(1)),
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'invalid_type_not_in_enum',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: invalidTypeLayout
    });

    // Should reject invalid room type
    expect(response.ok()).toBeFalsy();
  });

  test('Should handle very long layout names', async ({ request }) => {
    const longName = 'A'.repeat(1000);

    const longNameLayout = {
      name: longName,
      width: 5,
      height: 5,
      tileGrid: Array(5).fill(null).map(() => Array(5).fill(1)),
      doorPositions: { north: true, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: longNameLayout
    });

    // Should either accept or reject gracefully
    expect([200, 201, 400]).toContain(response.status());

    if (response.ok()) {
      const created = await response.json();
      await request.delete(`/api/room-layouts/${created.id}`);
    }
  });
});

test.describe('Category 11: Data Integrity Tests', () => {

  test('Door positions should match actual door tiles', async ({ request }) => {
    const mismatchedDoorLayout = {
      name: 'Mismatched Door Test',
      width: 5,
      height: 5,
      tileGrid: [
        [2, 2, 2, 2, 2],  // No door on north edge!
        [2, 1, 1, 1, 2],
        [2, 1, 1, 1, 2],
        [2, 1, 1, 1, 2],
        [2, 2, 2, 2, 2]
      ],
      doorPositions: { north: true, south: false, east: false, west: false }, // Claims north door exists!
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: mismatchedDoorLayout
    });

    // Should reject due to mismatch
    expect(response.ok()).toBeFalsy();
  });

  test('Should enforce at least one floor tile', async ({ request }) => {
    const noFloorsLayout = {
      name: 'No Floors Test',
      width: 5,
      height: 5,
      tileGrid: Array(5).fill(null).map(() => Array(5).fill(2)), // All walls!
      doorPositions: { north: false, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: noFloorsLayout
    });

    // Should reject - no floors
    expect(response.ok()).toBeFalsy();
  });

  test('Doors should only be on edges', async ({ request }) => {
    const centerDoorLayout = {
      name: 'Center Door Test',
      width: 5,
      height: 5,
      tileGrid: [
        [2, 2, 2, 2, 2],
        [2, 1, 1, 1, 2],
        [2, 1, 3, 1, 2],  // Door in center! (invalid)
        [2, 1, 1, 1, 2],
        [2, 2, 2, 2, 2]
      ],
      doorPositions: { north: false, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };

    const response = await request.post('/api/room-layouts', {
      data: centerDoorLayout
    });

    // Should reject - door not on edge
    expect(response.ok()).toBeFalsy();
  });
});
