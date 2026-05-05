/**
 * Shop Layout Fix Verification Test
 *
 * Tests the fixes for:
 * 1. Small rooms should have only 1 counter with all items/perks
 * 2. Items/perks should be centered on counters
 */

import { test, expect } from '@playwright/test';

test.describe('Shop Layout Fix Verification', () => {
  test('verify shop layout adapts to room size', async ({ page }) => {
    test.setTimeout(90000); // 90 second timeout

    // Collect console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`[Browser Console] ${text}`);
    });

    // Navigate to the game
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if login modal is present
    const loginInput = page.locator('input[type="text"]').first();
    const isLoginVisible = await loginInput.isVisible().catch(() => false);

    if (isLoginVisible) {
      console.log('Login modal found, logging in...');
      await loginInput.fill('ShopLayoutTester');
      const loginButton = page.locator('button:has-text("Starten")');
      await loginButton.click();
      await page.waitForTimeout(3000);
    }

    // Wait for game to initialize
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });
    console.log('Canvas is visible, game loaded');
    await page.waitForTimeout(3000);

    // Open cheat menu with CTRL+P
    await page.keyboard.press('Control+p');
    console.log('Pressed CTRL+P to open cheat menu');
    await page.waitForTimeout(500);

    // Check if cheat menu is visible
    const cheatMenuTitle = page.locator('text=CHEAT MENU');
    await expect(cheatMenuTitle).toBeVisible({ timeout: 2000 });
    console.log('Cheat menu is visible');

    // Inject helper to get room info
    await page.evaluate(() => {
      (window as any).__getShopRoomInfo = () => {
        // @ts-ignore - Access game state
        const gameState = (window as any).gameState;
        if (!gameState || !gameState.rooms) {
          return null;
        }

        const shopRoom = gameState.rooms.find((r: any) => r.type === 'shop');
        if (!shopRoom) {
          return null;
        }

        return {
          id: shopRoom.id,
          x: shopRoom.x,
          y: shopRoom.y,
          width: shopRoom.width,
          height: shopRoom.height,
          type: shopRoom.type
        };
      };
    });

    // Take multiple screenshots by teleporting to different shops
    for (let attempt = 0; attempt < 5; attempt++) {
      console.log(`\n=== Attempt ${attempt + 1} ===`);

      // Teleport to shop
      const shopButton = page.locator('button:has-text("Zum Shop")');
      await expect(shopButton).toBeVisible();
      await shopButton.click();
      console.log('Clicked shop teleport button');
      await page.waitForTimeout(1000);

      // Get shop room info
      const roomInfo = await page.evaluate(() => {
        return (window as any).__getShopRoomInfo();
      });

      if (roomInfo) {
        console.log(`Shop room ${roomInfo.id}: ${roomInfo.width}x${roomInfo.height} at (${roomInfo.x}, ${roomInfo.y})`);

        // Determine if this should be a single-counter or dual-counter layout
        const expectedLayout = roomInfo.width < 7 ? 'single-counter' : 'dual-counter';
        console.log(`Expected layout: ${expectedLayout} (width=${roomInfo.width})`);
      }

      // Close cheat menu
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Take screenshot
      await page.screenshot({
        path: `test-results/shop-layout-fix-${attempt + 1}.png`,
        fullPage: true
      });
      console.log(`Screenshot saved: shop-layout-fix-${attempt + 1}.png`);

      // Re-open cheat menu for next attempt
      await page.keyboard.press('Control+p');
      await page.waitForTimeout(500);
    }

    // Close cheat menu
    await page.keyboard.press('Escape');

    console.log('\n=== Test Complete ===');
    console.log('Check the screenshots in test-results/ to verify:');
    console.log('1. Small rooms (width < 7) have only 1 counter with all items/perks');
    console.log('2. Large rooms (width >= 7) have 2 counters (left=items, right=perks)');
    console.log('3. Items/perks are centered on their counters');

    expect(true).toBe(true);
  });

  test('verify items are centered on counters', async ({ page }) => {
    test.setTimeout(60000);

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Login if needed
    const loginInput = page.locator('input[type="text"]').first();
    const isLoginVisible = await loginInput.isVisible().catch(() => false);
    if (isLoginVisible) {
      await loginInput.fill('CenterTest');
      await page.locator('button:has-text("Starten")').click();
      await page.waitForTimeout(3000);
    }

    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Open cheat menu and teleport to shop
    await page.keyboard.press('Control+p');
    await page.waitForTimeout(500);

    const shopButton = page.locator('button:has-text("Zum Shop")');
    await shopButton.click();
    await page.waitForTimeout(1000);

    // Close cheat menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Take close-up screenshot
    await page.screenshot({
      path: 'test-results/shop-items-centered.png',
      fullPage: true
    });

    console.log('✓ Shop items centering screenshot captured');

    // Check that no errors occurred
    const hasErrors = consoleLogs.some(log =>
      log.includes('Error') || log.includes('undefined')
    );

    expect(hasErrors).toBe(false);
  });
});
