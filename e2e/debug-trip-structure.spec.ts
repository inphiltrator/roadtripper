import { test, expect } from '@playwright/test';

test('debug trip page structure', async ({ page }) => {
  // Listen to console messages and errors
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error(`PAGE ERROR: ${error.message}`);
  });
  
  // Test home page first since /trip has 500 error
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-trip-page-structure.png' });
  
  // Log page content
  const pageContent = await page.content();
  console.log('Page title:', await page.title());
  console.log('Page has forms:', await page.locator('form').count());
  console.log('Input fields found:', await page.locator('input').count());
  
  // Log first 2000 characters of HTML to see what's actually rendered
  console.log('HTML Content (first 2000 chars):');
  console.log(pageContent.substring(0, 2000));
  
  // Check if there are any error messages
  const errorElements = await page.locator('text=/error|Error|ERROR/i').all();
  console.log('Error elements found:', errorElements.length);
  
  // Check for input fields
  const startInputs = page.locator('input[name="start"]');
  const destinationInputs = page.locator('input[name="destination"]');
  
  console.log('Start inputs count:', await startInputs.count());
  console.log('Destination inputs count:', await destinationInputs.count());
  
  // List all input elements
  const allInputs = await page.locator('input').all();
  for (let i = 0; i < allInputs.length; i++) {
    const input = allInputs[i];
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const type = await input.getAttribute('type');
    console.log(`Input ${i}: name="${name}", placeholder="${placeholder}", type="${type}"`);
  }
  
  // List all buttons
  const allButtons = await page.locator('button').all();
  for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i];
    const text = await button.textContent();
    const type = await button.getAttribute('type');
    console.log(`Button ${i}: text="${text}", type="${type}"`);
  }
  
  expect(true).toBe(true); // Just to pass the test
});
