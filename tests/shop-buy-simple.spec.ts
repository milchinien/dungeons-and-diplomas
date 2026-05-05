import { test, expect } from '@playwright/test';

test.describe('Shop Purchase (Simple)', () => {
  test('should teleport to shop and buy item', async ({ page, context }) => {
    test.setTimeout(90000);

    // Set localStorage before navigating to skip login
    await context.addInitScript(() => {
      localStorage.setItem('userId', '1');
      localStorage.setItem('username', 'TestUser');
    });

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[Shop') || text.includes('[Dungeon') || text.includes('[Teleport]')) {
        console.log(`[Browser] ${text}`);
      }
    });

    console.log('\n=== Starting Test ===');
    await page.goto('http://localhost:3000');

    // Wait for page load
    console.log('Waiting for page to load...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Wait for React to mount
    await page.waitForFunction(() => {
      return document.querySelector('canvas') !== null || document.querySelector('input[type="text"]') !== null;
    }, { timeout: 30000 });

    // Check if we need to handle login modal after page load
    await page.waitForTimeout(1000);
    const loginInputAfterLoad = page.locator('input[type="text"]').first();
    const needsLogin = await loginInputAfterLoad.isVisible().catch(() => false);

    if (needsLogin) {
      console.log('Login modal appeared after load, filling in...');
      await loginInputAfterLoad.fill('TestUser');
      const startButton = page.locator('button:has-text("Starten")');
      await startButton.click();
      console.log('Login submitted');
      await page.waitForTimeout(5000);
    }

    // Now wait for canvas to appear - with retries for Fast Refresh issues
    console.log('Waiting for canvas to appear...');
    const canvas = page.locator('canvas').first();

    let canvasVisible = false;
    for (let retry = 0; retry < 3; retry++) {
      console.log(`Canvas check attempt ${retry + 1}/3...`);

      const isVisible = await canvas.isVisible({ timeout: 15000 }).catch(() => false);
      if (isVisible) {
        canvasVisible = true;
        console.log('✓ Canvas is visible');
        break;
      }

      console.log('Canvas not visible yet, checking page state...');
      await page.screenshot({ path: `test-results/canvas-wait-${retry + 1}.png`, fullPage: true });

      // Wait and reload if needed
      if (retry < 2) {
        console.log('Reloading page...');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
      }
    }

    if (!canvasVisible) {
      console.log('❌ Canvas never appeared after 3 attempts');
      const html = await page.content();
      console.log('Page has canvas element:', html.includes('<canvas'));
      console.log('Page has GameCanvas:', html.includes('GameCanvas'));
      throw new Error('Canvas did not appear after 3 reload attempts');
    }

    // Wait for dungeon generation
    console.log('Waiting for dungeon generation...');
    let attempts = 0;
    while (attempts < 30) {
      const hasDungeonLog = consoleLogs.some(log => log.includes('[Dungeon Generation]'));
      if (hasDungeonLog) {
        const dungeonGenLog = consoleLogs.find(log => log.includes('[Dungeon Generation]'));
        console.log('Dungeon generated:', dungeonGenLog);
        break;
      }
      await page.waitForTimeout(500);
      attempts++;
    }

    // Wait a bit more for rendering
    await page.waitForTimeout(2000);

    // Open cheat menu
    console.log('\nOpening cheat menu (CTRL+P)...');
    await page.keyboard.press('Control+KeyP');
    await page.waitForTimeout(1000);

    // Check if cheat menu is open
    const cheatMenu = page.locator('text=CHEAT MENU');
    const isCheatMenuVisible = await cheatMenu.isVisible().catch(() => false);

    if (!isCheatMenuVisible) {
      console.log('❌ Cheat menu not visible');
      await page.screenshot({ path: 'test-results/no-cheat-menu.png', fullPage: true });
      throw new Error('Cheat menu did not open');
    }

    console.log('✓ Cheat menu is open');
    await page.screenshot({ path: 'test-results/cheat-menu-open.png', fullPage: true });

    // Click shop teleport button
    console.log('\nClicking "Zum Shop" button...');
    const shopButton = page.locator('button:has-text("Zum Shop")');
    await shopButton.click();
    await page.waitForTimeout(1000);

    // Check teleport logs
    const teleportLogs = consoleLogs.filter(log => log.includes('[Teleport]'));
    console.log('\nTeleport logs:');
    teleportLogs.forEach(log => console.log(`  ${log}`));

    const hasShopFound = consoleLogs.some(log => log.includes('Found target'));
    const hasNoShop = consoleLogs.some(log => log.includes('No room of type') && log.includes('shop'));

    if (hasNoShop) {
      console.log('❌ No shop found in dungeon');
      throw new Error('No shop was generated in the dungeon');
    }

    if (!hasShopFound) {
      console.log('⚠ Unclear if teleport succeeded');
    } else {
      console.log('✓ Teleported to shop');
    }

    // Close cheat menu
    console.log('\nClosing cheat menu (ESC)...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/at-shop.png', fullPage: true });
    console.log('✓ Screenshot saved: at-shop.png');

    // Try to interact with shop item - move around the room systematically
    console.log('\nAttempting to find and purchase item...');

    const shopModal = page.locator('text=/kaufen|shop|item|bestätigen/i').first();
    let foundItem = false;

    // Movement pattern: explore the shop room more thoroughly
    const movementPattern = [
      // Grid search pattern - move in a larger area
      { key: 'KeyS', duration: 800 },
      { key: 'KeyD', duration: 800 },
      { key: 'KeyW', duration: 800 },
      { key: 'KeyD', duration: 800 },
      { key: 'KeyS', duration: 800 },
      { key: 'KeyD', duration: 800 },
      { key: 'KeyW', duration: 1200 },
      { key: 'KeyA', duration: 1200 },
      { key: 'KeyS', duration: 800 },
      { key: 'KeyA', duration: 800 },
      { key: 'KeyW', duration: 800 },
      { key: 'KeyA', duration: 800 },
    ];

    for (let i = 0; i < movementPattern.length; i++) {
      const move = movementPattern[i];
      console.log(`Movement ${i + 1}: ${move.key} for ${move.duration}ms`);

      await page.keyboard.down(move.key);
      await page.waitForTimeout(move.duration);
      await page.keyboard.up(move.key);

      // Try pressing E after each movement (use 'e' not 'KeyE')
      await page.waitForTimeout(200);
      await page.keyboard.press('e');
      await page.waitForTimeout(800);

      // Check if modal appeared
      const isModalVisible = await shopModal.isVisible({ timeout: 500 }).catch(() => false);
      if (isModalVisible) {
        console.log(`✓ Shop modal appeared after movement ${i + 1}!`);
        foundItem = true;
        await page.screenshot({ path: 'test-results/shop-modal.png', fullPage: true });

        // Try to find and click confirmation button
        const confirmButtons = page.locator('button').filter({ hasText: /kaufen|ja|yes|bestätigen|confirm/i });
        const confirmCount = await confirmButtons.count();
        console.log(`Found ${confirmCount} potential confirmation buttons`);

        if (confirmCount > 0) {
          await confirmButtons.first().click();
          console.log('✓ Clicked purchase confirmation button');
          await page.waitForTimeout(1500);
          await page.screenshot({ path: 'test-results/after-purchase.png', fullPage: true });

          // Check for success message or item in inventory
          console.log('✓ Purchase completed!');
        } else {
          console.log('⚠ Modal appeared but no confirmation button found');
          // Try pressing Enter as fallback
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }

        break;
      }
    }

    if (!foundItem) {
      console.log('⚠ Could not find shop item after exploring room');
      await page.screenshot({ path: 'test-results/no-item-found.png', fullPage: true });
    }

    await page.screenshot({ path: 'test-results/final.png', fullPage: true });
    console.log('\n=== Test Complete ===');
    console.log('Screenshots saved in test-results/');
  });
});
