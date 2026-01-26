import { test, expect } from '@playwright/test';

test('Debug login flow in detail', async ({ page }) => {
  test.setTimeout(60000);

  // Collect ALL console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Collect page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    const errorMsg = `PAGE ERROR: ${error.message}\nStack: ${error.stack}`;
    pageErrors.push(errorMsg);
    console.log('\n❌❌❌ ' + errorMsg + '\n');
  });

  // Collect failed requests
  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    const msg = `FAILED REQUEST: ${request.url()} - ${request.failure()?.errorText}`;
    failedRequests.push(msg);
    console.log('❌ ' + msg);
  });

  // Collect response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      const msg = `HTTP ${response.status()}: ${response.url()}`;
      console.log('❌ ' + msg);
    }
  });

  console.log('\n=== STEP 1: Navigate to page ===');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('\n=== STEP 2: Check page loaded ===');
  await page.screenshot({ path: 'test-results/debug-01-initial.png', fullPage: true });

  console.log('\n=== STEP 3: Find login modal ===');
  const loginInput = page.locator('input[type="text"]').first();
  const loginInputVisible = await loginInput.isVisible({ timeout: 5000 }).catch(() => false);

  if (!loginInputVisible) {
    console.log('❌ Login input not found!');
    await page.screenshot({ path: 'test-results/debug-02-no-login-input.png', fullPage: true });
    throw new Error('Login input not visible');
  }

  console.log('✓ Login input found');

  console.log('\n=== STEP 4: Fill username ===');
  await loginInput.fill('DebugTest');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/debug-03-username-filled.png', fullPage: true });

  console.log('\n=== STEP 5: Click Starten button ===');
  const startButton = page.locator('button:has-text("Starten")');
  const startButtonVisible = await startButton.isVisible();
  console.log(`Start button visible: ${startButtonVisible}`);

  if (!startButtonVisible) {
    throw new Error('Start button not found');
  }

  // Click and wait
  await startButton.click();
  console.log('✓ Clicked Starten button');

  console.log('\n=== STEP 6: Wait and observe ===');
  await page.waitForTimeout(3000);

  console.log('\n=== STEP 7: Check if login modal is still visible ===');
  const loginStillVisible = await loginInput.isVisible({ timeout: 1000 }).catch(() => false);

  if (loginStillVisible) {
    console.log('⚠ Login modal is STILL VISIBLE');
    await page.screenshot({ path: 'test-results/debug-04-login-still-visible.png', fullPage: true });

    // Check for error message in modal
    const errorText = await page.locator('p').filter({ hasText: /fehler|error/i }).textContent().catch(() => null);
    if (errorText) {
      console.log(`❌ Error message shown: "${errorText}"`);
    }

    // Check loading state
    const loadingText = await page.locator('button').filter({ hasText: /lädt/i }).textContent().catch(() => null);
    if (loadingText) {
      console.log(`⏳ Loading state: "${loadingText}"`);
    }
  } else {
    console.log('✅ Login modal DISAPPEARED - login successful!');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/debug-05-after-login.png', fullPage: true });

    // Check if canvas appeared
    const canvas = page.locator('canvas').first();
    const canvasVisible = await canvas.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Canvas visible: ${canvasVisible}`);
  }

  console.log('\n=== STEP 8: Summary ===');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Page errors: ${pageErrors.length}`);
  console.log(`Failed requests: ${failedRequests.length}`);

  if (pageErrors.length > 0) {
    console.log('\n❌❌❌ PAGE ERRORS:');
    pageErrors.forEach((err, i) => {
      console.log(`\n--- Error ${i + 1} ---`);
      console.log(err);
    });
  }

  if (failedRequests.length > 0) {
    console.log('\n❌ FAILED REQUESTS:');
    failedRequests.forEach(req => console.log(req));
  }

  // Show last 20 console messages
  console.log('\n=== Last 20 Console Messages ===');
  consoleMessages.slice(-20).forEach(msg => console.log(msg));

  // Save full log
  const fs = require('fs');
  fs.writeFileSync('test-results/debug-full-log.txt', consoleMessages.join('\n'));
  console.log('\n✓ Full log saved to test-results/debug-full-log.txt');

  // Final screenshot
  await page.screenshot({ path: 'test-results/debug-06-final.png', fullPage: true });

  // Assertions
  if (pageErrors.length > 0) {
    console.log('\n❌ TEST FAILED: Page errors detected');
    throw new Error(`Page errors detected: ${pageErrors[0]}`);
  }

  console.log('\n✅ TEST COMPLETED');
});
