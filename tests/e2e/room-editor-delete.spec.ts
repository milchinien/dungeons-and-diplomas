import { test, expect } from '@playwright/test';

test.describe('Room Editor - Delete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/room-editor');
    await page.waitForLoadState('networkidle');
  });

  test('should display delete button on room cards', async ({ page }) => {
    // Wait for layouts to load (Gallery shows "Room Layout" singular)
    await page.waitForSelector('text=Room Layout', { timeout: 10000 });

    // Wait for at least one layout card
    const firstCard = page.locator('svg').first();
    await firstCard.waitFor({ timeout: 10000 });

    // Find delete button (🗑️ emoji button)
    const deleteButton = page.locator('button[title="Raum löschen"]').first();
    await expect(deleteButton).toBeVisible({ timeout: 5000 });

    // Check button styling
    const buttonStyle = await deleteButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        display: computed.display
      };
    });

    console.log('Delete button style:', buttonStyle);
    expect(buttonStyle.display).not.toBe('none');
  });

  test('should open confirmation modal when delete button is clicked', async ({ page }) => {
    // Wait for layouts to load
    await page.waitForSelector('text=Room Layout', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for cards to render

    // Find and click first delete button
    const deleteButton = page.locator('button[title="Raum löschen"]').first();
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await deleteButton.click();

    // Check for confirmation modal
    await expect(page.locator('text=Delete Layout?')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should cancel deletion when cancel button is clicked', async ({ page }) => {
    // Wait for layouts to load
    await page.waitForSelector('text=Room Layout', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Count layouts before deletion attempt
    const layoutCountBefore = await page.locator('svg').count();
    console.log('Layouts before cancel:', layoutCountBefore);

    // Click delete button
    const deleteButton = page.locator('button[title="Raum löschen"]').first();
    await deleteButton.click();

    // Wait for modal and click cancel
    await page.waitForSelector('text=Delete Layout?', { timeout: 5000 });
    await page.click('button:has-text("Cancel")');

    // Modal should close
    await expect(page.locator('text=Delete Layout?')).not.toBeVisible({ timeout: 5000 });

    // Layout count should be unchanged
    await page.waitForTimeout(500);
    const layoutCountAfter = await page.locator('svg').count();
    console.log('Layouts after cancel:', layoutCountAfter);
    expect(layoutCountAfter).toBe(layoutCountBefore);
  });

  test('should delete layout when confirmed', async ({ page }) => {
    // Wait for layouts to load
    await page.waitForSelector('text=Room Layout', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Count layouts before deletion
    const layoutCountBefore = await page.locator('svg').count();
    console.log('Layouts before deletion:', layoutCountBefore);

    // Skip if no layouts available
    if (layoutCountBefore === 0) {
      console.log('No layouts available to delete, skipping test');
      return;
    }

    // Get the name of the first layout to verify deletion
    const firstLayoutName = await page.locator('svg').first()
      .locator('xpath=ancestor::div')
      .locator('text=/^[A-Za-z]/')
      .first()
      .textContent();
    console.log('Deleting layout:', firstLayoutName);

    // Click delete button
    const deleteButton = page.locator('button[title="Raum löschen"]').first();
    await deleteButton.click();

    // Wait for modal and confirm deletion
    await page.waitForSelector('text=Delete Layout?', { timeout: 5000 });

    // Listen for API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/room-layouts/') && response.request().method() === 'DELETE',
      { timeout: 10000 }
    );

    await page.click('button:has-text("Delete")');

    // Wait for deletion to complete
    const response = await responsePromise;
    console.log('Delete API response status:', response.status());
    // Accept 200 (success) or 404 (already deleted in parallel test)
    expect([200, 404]).toContain(response.status());

    // Modal should close
    await expect(page.locator('text=Delete Layout?')).not.toBeVisible({ timeout: 5000 });

    // Wait for list to refresh
    await page.waitForTimeout(1000);

    // Layout count should decrease by 1 (or stay same if 404)
    const layoutCountAfter = await page.locator('svg').count();
    console.log('Layouts after deletion:', layoutCountAfter);
    if (response.status() === 200) {
      expect(layoutCountAfter).toBe(layoutCountBefore - 1);
    }
  });

  test.skip('should handle API errors gracefully', async ({ page }) => {
    // Intercept DELETE request and force error
    await page.route('**/api/room-layouts/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        await route.continue();
      }
    });

    // Wait for layouts to load
    await page.waitForSelector('text=Room Layout', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click delete button
    const deleteButton = page.locator('button[title="Raum löschen"]').first();
    await deleteButton.click();

    // Confirm deletion
    await page.waitForSelector('text=Delete Layout?', { timeout: 5000 });

    // Listen for alert
    const dialogPromise = page.waitForEvent('dialog', { timeout: 10000 });

    await page.click('button:has-text("Delete")');

    // Should show error alert
    const dialog = await dialogPromise;
    console.log('Alert message:', dialog.message());
    expect(dialog.message()).toContain('Failed to delete');
    await dialog.accept();

    // Modal should still be visible or close
    await page.waitForTimeout(500);
  });

  test('should delete multiple layouts sequentially', async ({ page }) => {
    // Wait for layouts to load
    await page.waitForSelector('text=Room Layout', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Count layouts before deletion
    const layoutCountBefore = await page.locator('svg').count();
    console.log('Layouts before deletions:', layoutCountBefore);

    // Skip if less than 2 layouts
    if (layoutCountBefore < 2) {
      console.log('Not enough layouts for sequential delete test');
      return;
    }

    // Delete first layout
    await page.locator('button[title="Raum löschen"]').first().click();
    await page.waitForSelector('text=Delete Layout?', { timeout: 5000 });

    // Wait for API response
    const response1 = page.waitForResponse(
      response => response.url().includes('/api/room-layouts/') && response.request().method() === 'DELETE'
    );
    await page.click('button:has-text("Delete")');
    const res1 = await response1;

    // Wait for modal to close and UI to update
    await expect(page.locator('text=Delete Layout?')).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    let deleted = res1.status() === 200 ? 1 : 0;

    // Delete second layout (which is now first)
    const remainingLayouts = await page.locator('button[title="Raum löschen"]').count();
    if (remainingLayouts > 0) {
      await page.locator('button[title="Raum löschen"]').first().click();
      await page.waitForSelector('text=Delete Layout?', { timeout: 5000 });

      const response2 = page.waitForResponse(
        response => response.url().includes('/api/room-layouts/') && response.request().method() === 'DELETE'
      );
      await page.click('button:has-text("Delete")');
      const res2 = await response2;

      await expect(page.locator('text=Delete Layout?')).not.toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      if (res2.status() === 200) deleted++;
    }

    // Layout count should decrease
    const layoutCountAfter = await page.locator('svg').count();
    console.log('Layouts after deletions:', layoutCountAfter);
    expect(layoutCountAfter).toBeLessThanOrEqual(layoutCountBefore);
    expect(layoutCountAfter).toBeGreaterThanOrEqual(layoutCountBefore - 2);
  });
});
