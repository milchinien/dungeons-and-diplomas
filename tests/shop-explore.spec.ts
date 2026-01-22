import { test } from '@playwright/test';

test.describe('Shop Exploration', () => {
  test('explore shop and find items', async ({ page, context }) => {
    test.setTimeout(300000); // 5 minutes to explore

    await context.addInitScript(() => {
      localStorage.setItem('userId', '1');
      localStorage.setItem('username', 'Explorer');
    });

    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (
        text.includes('[useShopPurchase]') ||
        text.includes('[ShopRenderer]') ||
        text.includes('[Teleport]') ||
        text.includes('Player in shop')
      ) {
        console.log(text);
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Handle login if needed
    const loginInput = page.locator('input[type="text"]').first();
    const needsLogin = await loginInput.isVisible().catch(() => false);
    if (needsLogin) {
      await loginInput.fill('Explorer');
      await page.locator('button:has-text("Starten")').click();
      await page.waitForTimeout(5000);
    }

    // Wait for canvas with retries
    const canvas = page.locator('canvas').first();
    for (let i = 0; i < 3; i++) {
      const visible = await canvas.isVisible({ timeout: 10000 }).catch(() => false);
      if (visible) break;
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
    }

    console.log('\n=== Canvas loaded ===');
    await page.waitForTimeout(3000);

    // Open cheat menu and teleport to shop
    await page.keyboard.press('Control+KeyP');
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Zum Shop")').click();
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    console.log('\n=== Teleported to shop, starting exploration ===\n');
    await page.screenshot({ path: 'test-results/explore-start.png' });

    // Items are in the UPPER part of the shop, so move UP first!
    const moves = [
      // Move UP to where items are located
      { keys: ['w', 'w'], name: 'up-2-to-items' },
      // Scan left-right at item height
      { keys: ['a', 'a', 'a'], name: 'left-3' },
      { keys: ['d', 'd', 'd', 'd', 'd', 'd'], name: 'right-6-scan' },
      { keys: ['a', 'a', 'a'], name: 'back-left-3' },
    ];

    for (const move of moves) {
      console.log(`\n--- Move: ${move.name} ---`);

      for (const key of move.keys) {
        // Hold key for a bit to move one tile
        await page.keyboard.down(key);
        await page.waitForTimeout(300);
        await page.keyboard.up(key);
        await page.waitForTimeout(100);

        // Try E key at each position
        console.log('Pressing E...');
        await page.keyboard.press('e');
        await page.waitForTimeout(200);

        // Check if modal appeared
        const modal = page.locator('text=/kaufen|bestätigen/i').first();
        const hasModal = await modal.isVisible({ timeout: 300 }).catch(() => false);

        if (hasModal) {
          console.log('\n🎉 === MODAL FOUND! ===');
          await page.screenshot({ path: `test-results/found-modal-${move.name}.png` });

          // Log all shop purchase logs
          const shopLogs = logs.filter(l => l.includes('[useShopPurchase]'));
          console.log('\nShop purchase logs:');
          shopLogs.forEach(l => console.log(l));

          // Click buy button
          const buyBtn = page.locator('button').filter({ hasText: /kaufen|bestätigen/i }).first();
          await buyBtn.click();
          console.log('Clicked buy button!');
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'test-results/after-purchase.png' });

          console.log('\n=== Purchase complete! ===\n');
          return; // Exit test successfully
        }
      }

      await page.screenshot({ path: `test-results/explore-${move.name}.png` });
    }

    // If we get here, no item was found
    console.log('\n⚠️ No item found after full exploration');
    await page.screenshot({ path: 'test-results/explore-final.png' });

    // Print hook status logs
    const hookLogs = logs.filter(l => l.includes('[useShopPurchase]'));
    console.log('\n=== All useShopPurchase logs: ===');
    hookLogs.forEach(l => console.log(l));

    if (hookLogs.length === 0) {
      console.log('❌ NO HOOK LOGS - hook is not active!');
    }
  });
});
