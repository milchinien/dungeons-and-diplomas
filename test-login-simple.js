const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting login test...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect errors
  const errors = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ [CONSOLE ERROR] ${text}`);
      errors.push(text);
    } else {
      console.log(`[${type}] ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`\n❌❌❌ PAGE ERROR:`);
    console.log(`Message: ${error.message}`);
    console.log(`Stack: ${error.stack}\n`);
    errors.push(error.message);
  });

  try {
    console.log('📍 Step 1: Navigate to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded\n');

    await page.screenshot({ path: 'test-results/simple-01-loaded.png', fullPage: true });

    console.log('📍 Step 2: Find login input');
    const loginInput = await page.locator('input[type="text"]').first();
    const isVisible = await loginInput.isVisible({ timeout: 5000 });
    console.log(`Login input visible: ${isVisible}\n`);

    if (!isVisible) {
      throw new Error('Login input not found');
    }

    console.log('📍 Step 3: Fill username');
    await loginInput.fill('SimpleTest');
    await page.waitForTimeout(500);
    console.log('✅ Username filled\n');

    await page.screenshot({ path: 'test-results/simple-02-username.png', fullPage: true });

    console.log('📍 Step 4: Click Starten button');
    const startButton = await page.locator('button:has-text("Starten")');
    await startButton.click();
    console.log('✅ Button clicked\n');

    console.log('📍 Step 5: Wait 4 seconds...');
    await page.waitForTimeout(4000);

    await page.screenshot({ path: 'test-results/simple-03-after-click.png', fullPage: true });

    console.log('📍 Step 6: Check if login modal still visible');
    const stillVisible = await loginInput.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`Login modal still visible: ${stillVisible}\n`);

    if (stillVisible) {
      console.log('⚠️  Login did NOT succeed - modal still visible\n');

      // Check for error message
      const errorMsg = await page.locator('p').filter({ hasText: /fehler|error/i }).textContent().catch(() => null);
      if (errorMsg) {
        console.log(`❌ Error message: "${errorMsg}"\n`);
      }

      // Check button state
      const buttonText = await startButton.textContent();
      console.log(`Button text: "${buttonText}"\n`);
    } else {
      console.log('✅ Login successful - modal disappeared!\n');

      // Check for canvas
      const canvas = await page.locator('canvas').first();
      const canvasVisible = await canvas.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Canvas visible: ${canvasVisible}\n`);
    }

    await page.screenshot({ path: 'test-results/simple-04-final.png', fullPage: true });

    console.log('\n=== SUMMARY ===');
    console.log(`Total errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    } else {
      console.log('✅ No errors detected');
    }

  } catch (error) {
    console.log('\n❌❌❌ TEST FAILED:');
    console.log(error.message);
    await page.screenshot({ path: 'test-results/simple-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
    process.exit(errors.length > 0 ? 1 : 0);
  }
})();
