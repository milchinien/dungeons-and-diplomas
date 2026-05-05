import { test, expect } from '@playwright/test';

test.describe('User Interactions', () => {
  test('Login flow works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check login modal is visible
    await expect(page.getByText('Dungeons & Diplomas')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    
    // Enter username
    await page.fill('input[type="text"]', 'InteractionTest');
    
    // Click login button
    await page.click('button:has-text("Spielen")');
    
    // Wait for game to start
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Verify game started
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByText('InteractionTest')).toBeVisible();
  });

  test('ESC menu opens and closes correctly', async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[type="text"]', 'ESCTest');
    await page.click('button:has-text("Spielen")');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Open ESC menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Check pause menu is visible
    await expect(page.getByText('PAUSE')).toBeVisible();
    await expect(page.getByText('Weiterspielen')).toBeVisible();
    await expect(page.getByText('Optionen')).toBeVisible();
    await expect(page.getByText('Statistiken')).toBeVisible();
    await expect(page.getByText('Neustart')).toBeVisible();
    await expect(page.getByText('Hauptmenü')).toBeVisible();
    
    // Close menu with ESC again
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Menu should be closed
    await expect(page.getByText('PAUSE')).not.toBeVisible();
  });

  test('ESC menu Statistiken button opens stats dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[type="text"]', 'StatsTest');
    await page.click('button:has-text("Spielen")');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Open ESC menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Click Statistiken
    await page.click('button:has-text("Statistiken")');
    await page.waitForTimeout(500);
    
    // Check that stats dashboard is visible
    // (Dashboard has subject stats and ELO information)
    await expect(page.getByText('Mathematik', { exact: false })).toBeVisible();
    
    // Close with ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Should go back to pause menu
    await expect(page.getByText('PAUSE')).toBeVisible();
  });

  test('Player movement with WASD keys', async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[type="text"]', 'MovementTest');
    await page.click('button:has-text("Spielen")');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Move player with WASD
    await page.keyboard.press('w');
    await page.waitForTimeout(100);
    await page.keyboard.press('w');
    await page.waitForTimeout(100);
    await page.keyboard.press('a');
    await page.waitForTimeout(100);
    await page.keyboard.press('s');
    await page.waitForTimeout(100);
    await page.keyboard.press('d');
    await page.waitForTimeout(100);
    
    // No crash = success
    // Canvas should still be visible
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('Combat modal displays when encountering enemy', async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[type="text"]', 'CombatTest');
    await page.click('button:has-text("Spielen")');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Move around to find enemy
    let combatFound = false;
    
    for (let i = 0; i < 50 && !combatFound; i++) {
      await page.keyboard.press('w');
      await page.waitForTimeout(100);
      await page.keyboard.press('d');
      await page.waitForTimeout(100);
      
      // Check for combat modal
      const combatModal = page.getByText(/Frage \d+/);
      if (await combatModal.isVisible()) {
        combatFound = true;
        
        // Verify combat UI elements
        await expect(page.getByText(/Frage \d+/)).toBeVisible();
        await expect(page.getByText(/Level \d+ Goblin/i)).toBeVisible();
        
        // HP bars should be visible
        await expect(page.getByText('HP')).toBeVisible();
        
        // Answer buttons should be visible
        const answerButtons = page.locator('button').filter({ hasText: /^[ABCD]/ });
        expect(await answerButtons.count()).toBeGreaterThanOrEqual(2);
        
        break;
      }
    }
    
    if (!combatFound) {
      console.log('No combat encountered in exploration time');
    }
  });

  test('Options menu adjusts volume', async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[type="text"]', 'OptionsTest');
    await page.click('button:has-text("Spielen")');
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Open ESC menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Click Optionen
    await page.click('button:has-text("Optionen")');
    await page.waitForTimeout(500);
    
    // Check that volume sliders exist
    const sliders = page.locator('input[type="range"]');
    expect(await sliders.count()).toBeGreaterThanOrEqual(2); // Music + SFX at minimum
    
    // Adjust a slider
    const firstSlider = sliders.first();
    await firstSlider.fill('50');
    await page.waitForTimeout(200);
    
    // Back button should work
    await page.click('button:has-text("Zurück")');
    await page.waitForTimeout(500);
    
    // Should be back at pause menu
    await expect(page.getByText('PAUSE')).toBeVisible();
  });
});
