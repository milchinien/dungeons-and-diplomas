import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Dungeon/);
});

test('game canvas is present', async ({ page, context }) => {
  // Set localStorage to skip login
  await context.addInitScript(() => {
    localStorage.setItem('userId', '1');
    localStorage.setItem('username', 'TestUser');
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for login modal and handle if present
  await page.waitForTimeout(1000);
  const loginInput = page.locator('input[type="text"]').first();
  const needsLogin = await loginInput.isVisible().catch(() => false);

  if (needsLogin) {
    await loginInput.fill('TestUser');
    await page.locator('button:has-text("Starten")').click();
    await page.waitForTimeout(2000);
  }

  // Check if the main game canvas is present
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
});
