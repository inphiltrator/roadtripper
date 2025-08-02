import { test, expect } from '@playwright/test';

test('Southwest Roadtripper app loads', async ({ page }) => {
  await page.goto('http://localhost:5176');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: 'app-screenshot.png' });
  
  // Check if the title contains expected text
  await expect(page).toHaveTitle(/Southwest/);
  
  // Look for key elements
  const heading = page.locator('h1, h2, h3').first();
  await expect(heading).toBeVisible();
  
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());
});
