import { test, expect } from '@playwright/test';

test('Login should work', async ({ page }) => {
  test.setTimeout(30000);

  // Collect console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('[BROWSER ERROR]', msg.text());
    }
  });

  // Collect page errors
  const pageErrors: Error[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error);
    console.log('[PAGE ERROR]', error.message);
  });

  console.log('[TEST] Navigating to app...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  console.log('[TEST] Looking for login modal...');
  const loginInput = page.locator('input[type="text"]').first();
  await expect(loginInput).toBeVisible({ timeout: 5000 });
  console.log('[TEST] ✓ Login modal found');

  console.log('[TEST] Filling username...');
  await loginInput.fill('LoginTest');

  console.log('[TEST] Clicking Starten button...');
  const startButton = page.locator('button:has-text("Starten")');
  await startButton.click();

  // Wait a bit to see if errors occur
  await page.waitForTimeout(3000);

  // Check for errors
  if (consoleErrors.length > 0) {
    console.log('\n❌ CONSOLE ERRORS:');
    consoleErrors.forEach(err => console.log('  -', err));
  }

  if (pageErrors.length > 0) {
    console.log('\n❌ PAGE ERRORS:');
    pageErrors.forEach(err => console.log('  -', err.message));
  }

  // Check if login was successful (login modal should disappear)
  const isLoginStillVisible = await loginInput.isVisible({ timeout: 2000 }).catch(() => false);

  if (isLoginStillVisible) {
    console.log('❌ Login modal still visible - login failed!');
    await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });

    // Check if error message is shown in modal
    const errorMsg = page.locator('p').filter({ hasText: /fehler|error/i });
    const hasError = await errorMsg.count();
    if (hasError > 0) {
      const errorText = await errorMsg.first().textContent();
      console.log('Error message shown:', errorText);
    }

    throw new Error('Login failed - modal still visible');
  } else {
    console.log('✅ Login successful - modal disappeared');

    // Wait for canvas to appear
    const canvas = page.locator('canvas').first();
    const canvasVisible = await canvas.isVisible({ timeout: 5000 }).catch(() => false);

    if (canvasVisible) {
      console.log('✅ Canvas loaded - game started');
    } else {
      console.log('⚠ Canvas not visible yet');
    }

    await page.screenshot({ path: 'test-results/login-success.png', fullPage: true });
  }

  // Final assertion
  expect(consoleErrors.length).toBe(0);
  expect(pageErrors.length).toBe(0);
});
