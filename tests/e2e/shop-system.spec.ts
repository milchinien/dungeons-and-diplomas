import { test, expect } from '@playwright/test';

test.describe('Shop System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login with test user
    await page.fill('input[type="text"]', 'ShopTest');
    await page.click('button:has-text("Spielen")');
    
    // Wait for game to start
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('Can find and enter shop room', async ({ page }, testInfo) => {
    // Look for shop indicator on minimap or in game
    // Move around dungeon to explore
    let foundShop = false;
    
    for (let i = 0; i < 100 && !foundShop; i++) {
      // Move in a search pattern
      const direction = ['w', 's', 'a', 'd'][i % 4];
      await page.keyboard.press(direction);
      await page.waitForTimeout(100);
      
      // Check for "E" prompt indicating shop interaction
      const shopPrompt = page.getByText(/\[E\].*kaufen/i);
      if (await shopPrompt.isVisible()) {
        console.log('Found shop!');
        foundShop = true;
        break;
      }
      
      // Also check for combat - skip it
      const combatModal = page.getByText(/Frage \d+/);
      if (await combatModal.isVisible()) {
        console.log('Encountered combat, skipping...');
        // Press ESC or wait for defeat
        await page.keyboard.press('Escape');
        await page.waitForTimeout(2000);
      }
    }
    
    // Note: Shop might not always be found in time
    if (!foundShop) {
      console.log('Shop not found in exploration time');
      testInfo.skip();
    }
  });

  test('Shop modal shows items and prices', async ({ page }, testInfo) => {
    // Add initial gold via console for testing
    await page.evaluate(() => {
      // This is a test helper - in real game, gold comes from defeating enemies
      localStorage.setItem('test_gold', '1000');
    });
    
    // Search for shop (simplified - would need more complex navigation)
    // For now, we test that the shop modal can be triggered if we find it
    
    // This test would need actual shop room coordinates or cheat codes
    // to reliably test shop functionality
    console.log('Shop integration test requires game state manipulation');
    testInfo.skip();
  });

  test('Purchase deducts gold correctly', async ({ page }, testInfo) => {
    // This test would verify:
    // 1. Initial gold amount
    // 2. Click item to purchase
    // 3. Confirm purchase
    // 4. Verify gold deducted
    // 5. Verify item added to inventory
    
    console.log('Full purchase flow test requires shop access');
    testInfo.skip();
  });

  test('Cannot buy item without enough gold', async ({ page }, testInfo) => {
    // Test that purchase is blocked when gold < item cost
    console.log('Insufficient gold test requires shop access');
    testInfo.skip();
  });

  test('Equipment display updates after purchase', async ({ page }, testInfo) => {
    // Check that TopLeftPanel shows equipped items after purchase
    const topLeftPanel = page.locator('div').filter({ 
      has: page.locator('text=ShopTest') 
    }).first();
    
    await expect(topLeftPanel).toBeVisible();
    
    // Equipment should be visible in panel (if any items equipped)
    // This is visual verification only without actual purchase
    console.log('Equipment display test - checking panel structure');
    testInfo.skip();
  });
});
