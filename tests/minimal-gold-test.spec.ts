import { test, expect } from '@playwright/test';

test('Minimal gold and shop system test', async ({ page }) => {
  test.setTimeout(45000);

  console.log('[TEST] Starting minimal gold test');

  // Go to app
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');

  console.log('[TEST] Page loaded');

  // Login if needed
  const loginInput = page.locator('input[type="text"]').first();
  if (await loginInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('[TEST] Logging in');
    await loginInput.fill('MinimalTest');
    await page.locator('button:has-text("Starten")').click();
    await page.waitForTimeout(1500);
  }

  console.log('[TEST] Waiting for canvas');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 10000 });

  console.log('[TEST] ✓ Canvas visible');

  // Wait for game to initialize
  await page.waitForTimeout(2000);

  // Test 1: Check if cheat menu opens
  await page.keyboard.press('Control+p');
  await page.waitForTimeout(300);

  const cheatMenu = page.locator('text=CHEAT MENU');
  const menuVisible = await cheatMenu.isVisible({ timeout: 2000 }).catch(() => false);

  console.log(`[TEST] Cheat menu visible: ${menuVisible}`);
  expect(menuVisible).toBeTruthy();

  // Test 2: Check for gold button
  const goldButton = page.locator('button').filter({ hasText: /gold/i });
  const goldBtnCount = await goldButton.count();
  console.log(`[TEST] Gold buttons found: ${goldBtnCount}`);

  // Test 3: Check for shop teleport button
  const shopButton = page.locator('button:has-text("Zum Shop")');
  const shopBtnVisible = await shopButton.isVisible({ timeout: 1000 }).catch(() => false);
  console.log(`[TEST] Shop teleport button: ${shopBtnVisible}`);

  // Close cheat menu
  await page.keyboard.press('Escape');

  console.log('[TEST] ✓ Test completed successfully');

  // Final verification
  expect(await canvas.isVisible()).toBeTruthy();
});
