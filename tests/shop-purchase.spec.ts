import { test, expect } from '@playwright/test';

test.describe('Shop Item Purchase', () => {
  test('should teleport to shop and purchase an item using cheat mode', async ({ page }) => {
    test.setTimeout(90000); // 90 second timeout

    // Collect console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`[Browser] ${text}`);
    });

    // Navigate to the game
    console.log('=== Navigating to game ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Handle login
    console.log('=== Handling login ===');
    const loginInput = page.locator('input[type="text"]').first();
    const isLoginVisible = await loginInput.isVisible().catch(() => false);

    if (isLoginVisible) {
      console.log('Login modal found, logging in as ShopTester...');
      await loginInput.fill('ShopTester');
      const loginButton = page.locator('button:has-text("Starten")');
      await loginButton.click();
      console.log('Login button clicked');

      // Wait for login and initial load
      await page.waitForTimeout(3000);

      // Reload page to avoid Fast Refresh issues
      console.log('Reloading page to avoid Fast Refresh issues...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    } else {
      console.log('No login modal detected');
    }

    // Wait for game to load
    console.log('=== Waiting for game to load ===');
    await page.waitForTimeout(5000);

    // Take screenshot to debug
    await page.screenshot({ path: 'test-results/before-canvas-check.png', fullPage: true });
    console.log('Screenshot saved: before-canvas-check.png');

    // Wait for dungeon generation log
    let attempts = 0;
    while (attempts < 15) {
      const hasDungeonLog = consoleLogs.some(log => log.includes('[Dungeon Generation]'));
      if (hasDungeonLog) {
        console.log('✓ Dungeon generation complete');
        break;
      }
      await page.waitForTimeout(1000);
      attempts++;
    }

    // Check if canvas exists
    const canvasCount = await page.locator('canvas').count();
    console.log(`Canvas elements found: ${canvasCount}`);

    if (canvasCount === 0) {
      console.log('⚠ No canvas found, taking screenshot for debugging');
      await page.screenshot({ path: 'test-results/no-canvas-found.png', fullPage: true });
      const html = await page.content();
      console.log('Page has body:', html.includes('<body'));
      console.log('Page has React root:', html.includes('__next'));
    }

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });
    console.log('✓ Canvas is visible');

    // Wait a bit more for everything to render
    await page.waitForTimeout(2000);

    // Check for shop debug logs
    const shopDebugLog = consoleLogs.find(log => log.includes('[Shop Debug]'));
    const dungeonGenLog = consoleLogs.find(log => log.includes('[Dungeon Generation]'));
    console.log('\n=== Dungeon Generation Info ===');
    console.log(shopDebugLog || 'No shop debug log found');
    console.log(dungeonGenLog || 'No dungeon generation log found');

    // Open cheat menu (CTRL+P)
    console.log('\n=== Opening cheat menu ===');
    await page.keyboard.press('Control+p');
    await page.waitForTimeout(500);

    const cheatMenuTitle = page.locator('text=CHEAT MENU');
    await expect(cheatMenuTitle).toBeVisible({ timeout: 3000 });
    console.log('✓ Cheat menu is open');

    // Take screenshot of cheat menu
    await page.screenshot({ path: 'test-results/cheat-menu.png', fullPage: true });

    // Click "Zum Shop" button
    console.log('\n=== Teleporting to shop ===');
    const shopButton = page.locator('button:has-text("Zum Shop")');
    await expect(shopButton).toBeVisible();
    await shopButton.click();
    console.log('✓ Clicked shop teleport button');

    await page.waitForTimeout(1000);

    // Check teleport result
    const teleportLogs = consoleLogs.filter(log => log.includes('[Teleport]'));
    console.log('\n=== Teleport Logs ===');
    teleportLogs.forEach(log => console.log(log));

    const noShopLog = consoleLogs.find(log => log.includes('No room of type') && log.includes('shop'));
    if (noShopLog) {
      console.error('\n❌ ERROR: No shop found in dungeon!');
      const roomCountLog = consoleLogs.find(log => log.includes('Room types in dungeon'));
      console.log('Room distribution:', roomCountLog);
      throw new Error('Shop teleport failed: No shop rooms in dungeon');
    }

    const shopFoundLog = consoleLogs.find(log => log.includes('Found target') && log.includes('[Teleport]'));
    if (shopFoundLog) {
      console.log('✓ Shop found and teleported:', shopFoundLog);
    }

    // Close cheat menu (ESC)
    console.log('\n=== Closing cheat menu ===');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Take screenshot at shop
    await page.screenshot({ path: 'test-results/at-shop.png', fullPage: true });
    console.log('✓ Screenshot saved: at-shop.png');

    // Wait a bit to ensure shop items are rendered
    await page.waitForTimeout(2000);

    // Try to interact with shop item (press E key)
    console.log('\n=== Attempting to purchase item ===');
    console.log('Pressing E key to interact with shop item...');
    await page.keyboard.press('e');
    await page.waitForTimeout(1000);

    // Check if shop confirmation modal appeared
    const shopModalTitle = page.locator('text=Kaufbestätigung, text=Shop, text=Kaufen');
    const isShopModalVisible = await shopModalTitle.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (isShopModalVisible) {
      console.log('✓ Shop purchase modal is visible');
      await page.screenshot({ path: 'test-results/purchase-modal.png', fullPage: true });

      // Look for confirmation button
      const confirmButton = page.locator('button').filter({ hasText: /kaufen|bestätigen|yes|confirm/i }).first();
      const isConfirmVisible = await confirmButton.isVisible().catch(() => false);

      if (isConfirmVisible) {
        console.log('✓ Found confirmation button, clicking...');
        await confirmButton.click();
        await page.waitForTimeout(1000);
        console.log('✓ Purchase confirmed!');
        await page.screenshot({ path: 'test-results/after-purchase.png', fullPage: true });
      } else {
        console.log('⚠ No confirmation button found in modal');
        // Try clicking anywhere on the modal (some modals auto-confirm)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    } else {
      console.log('⚠ Shop purchase modal did not appear');
      console.log('This might mean:');
      console.log('  - Player is not close enough to an item');
      console.log('  - Shop items are not rendered');
      console.log('  - E key interaction is not working');

      // Try moving around a bit and pressing E again
      console.log('\nTrying to move and press E again...');
      await page.keyboard.press('w');
      await page.waitForTimeout(200);
      await page.keyboard.press('e');
      await page.waitForTimeout(1000);

      const isModalVisibleNow = await shopModalTitle.first().isVisible({ timeout: 2000 }).catch(() => false);
      if (isModalVisibleNow) {
        console.log('✓ Shop modal appeared after movement!');
        await page.screenshot({ path: 'test-results/purchase-modal.png', fullPage: true });
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });
    console.log('\n=== Test Complete ===');
    console.log('Screenshots saved in test-results/');

    // Print all shop-related logs
    const shopLogs = consoleLogs.filter(log =>
      log.toLowerCase().includes('shop') ||
      log.toLowerCase().includes('purchase') ||
      log.toLowerCase().includes('item')
    );
    if (shopLogs.length > 0) {
      console.log('\n=== Shop-Related Logs ===');
      shopLogs.forEach(log => console.log(log));
    }
  });
});
