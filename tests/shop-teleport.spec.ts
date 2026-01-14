import { test, expect } from '@playwright/test';

test.describe('Shop Teleport Cheat', () => {
  test('should be able to teleport to shop', async ({ page }) => {
    test.setTimeout(60000); // 60 second timeout
    // Collect console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`[Browser Console] ${text}`);
    });

    // Navigate to the game (adjust port if needed)
    await page.goto('http://localhost:3003');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for login modal or canvas
    await page.waitForTimeout(2000);

    // Check if login modal is present
    const loginInput = page.locator('input[type="text"]').first();
    const isLoginVisible = await loginInput.isVisible().catch(() => false);

    if (isLoginVisible) {
      console.log('Login modal found, logging in...');
      await loginInput.fill('PlaywrightTest');

      const loginButton = page.locator('button:has-text("Starten")');
      await loginButton.click();
      console.log('Clicked login button');

      // Wait for login to complete and game to load
      await page.waitForTimeout(5000);

      // Take screenshot after login
      await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
      console.log('Screenshot saved: after-login.png');
    } else {
      console.log('No login modal, assuming already logged in or not needed');
    }

    // Wait for game to initialize (canvas should be visible)
    console.log('Waiting for canvas to appear...');

    // Wait for any Fast Refresh rebuilds
    await page.waitForTimeout(3000);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });
    console.log('Canvas is visible, game loaded');

    // Wait a bit for dungeon generation
    await page.waitForTimeout(3000);

    // Look for the debug log that shows room distribution
    const shopDebugLog = consoleLogs.find(log => log.includes('[Shop Debug]'));
    console.log('Shop debug log:', shopDebugLog);

    // Open cheat menu with CTRL+P
    await page.keyboard.press('Control+p');
    console.log('Pressed CTRL+P to open cheat menu');

    // Wait for cheat menu to appear
    await page.waitForTimeout(500);

    // Check if cheat menu is visible
    const cheatMenuTitle = page.locator('text=CHEAT MENU');
    await expect(cheatMenuTitle).toBeVisible({ timeout: 2000 });
    console.log('Cheat menu is visible');

    // Find and click the "Zum Shop" button
    const shopButton = page.locator('button:has-text("Zum Shop")');
    await expect(shopButton).toBeVisible();
    console.log('Shop teleport button found');

    // Click the shop button
    await shopButton.click();
    console.log('Clicked shop teleport button');

    // Wait a bit to see the result
    await page.waitForTimeout(1000);

    // Check console logs for teleport result
    const teleportLogs = consoleLogs.filter(log => log.includes('[Teleport]'));
    console.log('\n=== Teleport Logs ===');
    teleportLogs.forEach(log => console.log(log));

    // Check if shop was found
    const shopFoundLog = consoleLogs.find(log => log.includes('Found target') && log.includes('[Teleport]'));
    const noShopLog = consoleLogs.find(log => log.includes('No room of type') && log.includes('shop'));

    if (noShopLog) {
      console.error('\n❌ ERROR: No shop found in dungeon!');

      // Print room type counts
      const roomCountLog = consoleLogs.find(log => log.includes('Room types in dungeon'));
      console.log('\nRoom distribution:', roomCountLog);

      // Print shop debug info
      const shopDebugLogs = consoleLogs.filter(log => log.includes('[Shop Debug]'));
      console.log('\nShop debug info:');
      shopDebugLogs.forEach(log => console.log(log));

      // Print dungeon generation log
      const dungeonGenLog = consoleLogs.find(log => log.includes('[Dungeon Generation]'));
      console.log('\nDungeon generation:', dungeonGenLog);

      throw new Error('Shop teleport failed: No shop rooms generated in dungeon');
    }

    if (shopFoundLog) {
      console.log('\n✅ SUCCESS: Shop was found and teleport worked!');
      console.log('Teleport target:', shopFoundLog);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/shop-teleport.png', fullPage: true });
  });
});
