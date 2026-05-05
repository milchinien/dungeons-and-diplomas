import { test, expect } from '@playwright/test';

test.describe('Console Log Check', () => {
  test('should capture dungeon generation logs', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('DungeonGen') || text.includes('dungeon') || text.includes('Dungeon')) {
        consoleLogs.push(text);
        console.log('[BROWSER]', text);
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.fill('input[type="text"]', 'ConsoleLogUser');

    const submitButton = page.locator('button:has-text("Starten"), button:has-text("Start"), button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    const playButton = page.locator('button:has-text("Spielen"), button:has-text("Play")').first();
    if (await playButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await playButton.click();
    }

    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(3000);

    console.log('\n=== Captured Dungeon Generation Logs ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('========================================\n');
  });
});
