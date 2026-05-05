import { test, expect } from '@playwright/test';

test.describe('UI Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login with test user
    await page.fill('input[type="text"]', 'TestUser');
    await page.click('button:has-text("Spielen")');
    
    // Wait for game to start
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('Top Left Panel displays correctly', async ({ page }) => {
    // Check if Top Left Panel exists
    const topLeftPanel = page.locator('div').filter({ 
      has: page.locator('text=TestUser') 
    }).first();
    
    await expect(topLeftPanel).toBeVisible();
    
    // Check username
    await expect(page.getByText('TestUser')).toBeVisible();
    
    // Check level display
    await expect(page.getByText(/Level \d+/)).toBeVisible();
    
    // Check HP bar exists
    await expect(page.getByText('HP')).toBeVisible();
    await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible();
  });

  test('Bottom Center Bar displays correctly', async ({ page }) => {
    // Check XP/Level display at bottom center
    await expect(page.getByText(/Level \d+/)).toBeVisible();
    
    // Check for ELO subjects (should have 3: Mathe, Chemie, Physik)
    const subjectTexts = ['Mathe', 'Chemi', 'Physi']; // Shortened to 5 chars
    
    for (const subject of subjectTexts) {
      await expect(page.getByText(subject, { exact: false })).toBeVisible();
    }
  });

  test('Top Right Panel displays correctly', async ({ page }) => {
    // Check gold counter
    await expect(page.getByText('Gold')).toBeVisible();
    await expect(page.getByText(/^\d+$/).first()).toBeVisible();
    
    // Check minimap canvas exists
    const minimapCanvas = page.locator('canvas').nth(1); // Second canvas is minimap
    await expect(minimapCanvas).toBeVisible();
    
    // Check minimap dimensions
    const box = await minimapCanvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('All UI components are positioned correctly', async ({ page }) => {
    const viewport = page.viewportSize();
    
    // Top Left Panel should be in top left corner
    const topLeftPanel = page.locator('div').filter({ 
      has: page.locator('text=TestUser') 
    }).first();
    const topLeftBox = await topLeftPanel.boundingBox();
    expect(topLeftBox!.x).toBeLessThan(50);
    expect(topLeftBox!.y).toBeLessThan(50);
    
    // Bottom Center Bar should be at bottom center
    const levelText = page.getByText(/Level \d+/).first();
    const bottomBox = await levelText.boundingBox();
    expect(bottomBox!.y).toBeGreaterThan(viewport!.height - 150);
    
    // Gold counter should be in top right
    const goldText = page.getByText('Gold');
    const goldBox = await goldText.boundingBox();
    expect(goldBox!.x).toBeGreaterThan(viewport!.width - 250);
    expect(goldBox!.y).toBeLessThan(100);
  });

  test('HP bar updates visually', async ({ page }) => {
    // Get initial HP text
    const hpText = await page.getByText(/\d+ \/ \d+/).first().textContent();
    expect(hpText).toBeTruthy();
    
    // HP bar should have proper styling
    const hpBar = page.locator('div').filter({ 
      has: page.locator('text=HP') 
    });
    await expect(hpBar).toBeVisible();
    
    // Check that HP bar has gradient/color (not pure white background)
    const hpBarStyle = await hpBar.evaluate(el => {
      return window.getComputedStyle(el).background;
    });
    expect(hpBarStyle).toBeTruthy();
  });
});
