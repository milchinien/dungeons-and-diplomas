import { test, expect } from '@playwright/test';

test.describe('Gold System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login with test user
    await page.fill('input[type="text"]', 'PlaywrightTest');
    await page.click('button:has-text("Spielen")');
    
    // Wait for game to start
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for game initialization
  });

  test('Gold does not update infinitely (performance test)', async ({ page }) => {
    // Monitor console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Gold updated') || msg.text().includes('Gold gained')) {
        consoleLogs.push(msg.text());
      }
    });

    // Get initial gold value
    const initialGoldText = await page.locator('text=Gold').locator('..').textContent();
    const initialGold = parseInt(initialGoldText?.match(/\d+/)?.[0] || '0');

    // Wait for 3 seconds
    await page.waitForTimeout(3000);

    // Check console logs - should be minimal (< 5 logs in 3 seconds)
    expect(consoleLogs.length).toBeLessThan(5);
    console.log(`Console logs in 3 seconds: ${consoleLogs.length}`);

    // Gold should not have changed without defeating enemies
    const finalGoldText = await page.locator('text=Gold').locator('..').textContent();
    const finalGold = parseInt(finalGoldText?.match(/\d+/)?.[0] || '0');
    
    expect(finalGold).toBe(initialGold);
  });

  test('Gold increases after defeating enemy', async ({ page }) => {
    // Get initial gold
    const getGold = async () => {
      const goldText = await page.locator('text=Gold').locator('..').textContent();
      return parseInt(goldText?.match(/\d+/)?.[0] || '0');
    };

    const initialGold = await getGold();

    // Move player towards enemies using WASD
    // Simulate exploration to find an enemy
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('w');
      await page.waitForTimeout(100);
      await page.keyboard.press('d');
      await page.waitForTimeout(100);
      
      // Check if combat modal appeared
      const combatModal = page.getByText(/Frage \d+/);
      if (await combatModal.isVisible()) {
        console.log('Combat started!');
        
        // Answer questions until combat ends
        for (let q = 0; q < 10; q++) {
          await page.waitForTimeout(500);
          
          // Click first answer button
          const answerButtons = page.locator('button').filter({ hasText: /^[ABCD]/ });
          const firstButton = answerButtons.first();
          if (await firstButton.isVisible()) {
            await firstButton.click();
          }
          
          await page.waitForTimeout(2000);
          
          // Check if combat ended
          if (!await combatModal.isVisible()) {
            console.log('Combat ended!');
            break;
          }
        }
        
        // Wait for gold update
        await page.waitForTimeout(1000);
        
        // Check that gold increased
        const finalGold = await getGold();
        console.log(`Gold: ${initialGold} -> ${finalGold}`);
        
        expect(finalGold).toBeGreaterThan(initialGold);
        expect(finalGold - initialGold).toBeGreaterThanOrEqual(10); // At least 10 gold per enemy
        expect(finalGold - initialGold).toBeLessThanOrEqual(100); // At most 100 gold per enemy
        
        break;
      }
    }
  });

  test('Gold counter displays correctly', async ({ page }) => {
    // Check gold counter exists and is visible
    await expect(page.getByText('Gold')).toBeVisible();
    
    // Check that gold value is a number
    const goldContainer = page.locator('text=Gold').locator('..');
    const goldText = await goldContainer.textContent();
    const goldMatch = goldText?.match(/\d+/);
    
    expect(goldMatch).toBeTruthy();
    const goldValue = parseInt(goldMatch![0]);
    expect(goldValue).toBeGreaterThanOrEqual(0);
    
    // Gold should be displayed with proper styling (top right)
    const goldBox = await goldContainer.boundingBox();
    expect(goldBox!.x).toBeGreaterThan(page.viewportSize()!.width - 300);
  });
});
