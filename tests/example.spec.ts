import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Dungeons/);
});

test('game canvas is present', async ({ page }) => {
  await page.goto('/');

  // Check if the main game canvas is present
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
});
