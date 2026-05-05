import { test, expect } from '@playwright/test';

test('Quick visual wall check', async ({ page }) => {
  // Navigate to game
  await page.goto('http://localhost:3000');

  // Wait a bit for initial load
  await page.waitForTimeout(2000);

  // Check if login modal appears
  const loginInput = page.locator('input[type="text"]').first();
  const needsLogin = await loginInput.isVisible().catch(() => false);

  if (needsLogin) {
    await loginInput.fill('TestUser');
    await page.locator('button:has-text("Starten")').click();
    await page.waitForTimeout(2000);
  }

  // Wait for canvas to appear
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForTimeout(5000); // Give time for dungeon to generate

  // Take screenshot
  await page.screenshot({
    path: 'test-results/wall-fix-visual-check.png',
    fullPage: true
  });

  console.log('✓ Screenshot saved to test-results/wall-fix-visual-check.png');
  console.log('✓ Visual inspection: Check for double walls, missing walls, isolated walls');
});
