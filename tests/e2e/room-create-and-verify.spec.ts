import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Test: Room layout creation via editor and verification in-game
 *
 * Steps (all in one sequential test):
 * 1. Create a unique room layout via the editor UI
 * 2. Verify it appears in the gallery
 * 3. Verify it's available via API (layout pool)
 * 4. Start the game and verify the layout pool contains the new room
 * 5. Clean up: delete the created layout
 */

const TEST_LAYOUT_NAME = `E2E-Test-Room-${Date.now()}`;

async function loginAndStartGame(page: Page, username = 'playwright_room_test') {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const loginInput = page.locator('input[type="text"]');
  await loginInput.waitFor({ timeout: 10000 });
  await loginInput.fill(username);
  await page.locator('button[type="submit"]').click();

  const playBtn = page.locator('button').filter({ hasText: /Spielen/i });
  await playBtn.waitFor({ timeout: 10000 });
  await playBtn.click();

  await page.locator('canvas').first().waitFor({ timeout: 15000 });
}

test('Create room in editor, verify in gallery, API, and game', async ({ page, request }) => {
  page.on('dialog', async (dialog) => { await dialog.accept(); });
  let createdLayoutId: number | null = null;

  try {
    // === STEP 1: Create a valid room layout via the editor ===
    await page.goto('/room-editor/create');
    await page.waitForLoadState('networkidle');

    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ timeout: 10000 });

    // Set layout name
    const nameInput = page.locator('input[placeholder="Layout name..."]');
    await nameInput.waitFor();
    await nameInput.fill(TEST_LAYOUT_NAME);

    // Select Pen tool + Floor tile
    await page.locator('text=✏️ Pen').click();
    await page.locator('text=Floor').click();

    // Draw a 6x6 block of floor tiles (rows 1-6, cols 1-6) in the 8x8 grid
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    const tileSize = box!.width / 8;

    for (let row = 1; row <= 6; row++) {
      for (let col = 1; col <= 6; col++) {
        await canvas.click({
          position: {
            x: col * tileSize + tileSize / 2,
            y: row * tileSize + tileSize / 2
          }
        });
      }
    }

    // Place doors on edges using Door tool
    await page.locator('text=🚪 Door').click();

    // North door: row 0, col 4
    await canvas.click({ position: { x: 4 * tileSize + tileSize / 2, y: tileSize / 2 } });
    // South door: row 7, col 4
    await canvas.click({ position: { x: 4 * tileSize + tileSize / 2, y: 7 * tileSize + tileSize / 2 } });
    // East door: col 7, row 4
    await canvas.click({ position: { x: 7 * tileSize + tileSize / 2, y: 4 * tileSize + tileSize / 2 } });
    // West door: col 0, row 4
    await canvas.click({ position: { x: tileSize / 2, y: 4 * tileSize + tileSize / 2 } });

    // Wait for live validation to pass
    await page.waitForTimeout(500);

    // Save button should be enabled
    const saveBtn = page.locator('button').filter({ hasText: /Save Layout/i });
    await saveBtn.waitFor();
    await expect(saveBtn).not.toBeDisabled();

    // Save the layout
    await saveBtn.click();
    await page.waitForTimeout(1500);

    // Confirm save succeeded: title changes to "Layout bearbeiten"
    await expect(page.locator('text=Layout bearbeiten')).toBeVisible({ timeout: 5000 });

    // === STEP 2: Verify layout appears in gallery ===
    await page.goto('/room-editor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const card = page.locator('div').filter({ hasText: TEST_LAYOUT_NAME });
    await expect(card.first()).toBeVisible({ timeout: 5000 });

    // === STEP 3: Verify layout is available via API ===
    const apiResponse = await request.get('/api/room-layouts');
    expect(apiResponse.ok()).toBeTruthy();

    const layouts = await apiResponse.json();
    const found = layouts.find((l: any) => l.name === TEST_LAYOUT_NAME);
    expect(found).toBeTruthy();
    expect(found.width).toBe(8);
    expect(found.height).toBe(8);
    expect(found.doorPositions.north).toBe(true);
    expect(found.doorPositions.south).toBe(true);
    expect(found.doorPositions.east).toBe(true);
    expect(found.doorPositions.west).toBe(true);
    createdLayoutId = found.id;

    // === STEP 4: Verify layout pool contains the room when game starts ===
    await loginAndStartGame(page);

    // Fetch layouts from API (same call the game makes during dungeon generation)
    const layoutsResponse = await page.evaluate(async () => {
      const res = await fetch('/api/room-layouts');
      return res.json();
    });

    const testLayout = layoutsResponse.find((l: any) => l.name === TEST_LAYOUT_NAME);
    expect(testLayout).toBeTruthy();
    expect(testLayout.name).toBe(TEST_LAYOUT_NAME);

    // Verify game is fully loaded: main canvas + minimap (at least 2 canvases)
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThanOrEqual(2);

  } finally {
    // === STEP 5: Cleanup ===
    if (createdLayoutId) {
      await request.delete(`/api/room-layouts/${createdLayoutId}`);
    }
  }
});
