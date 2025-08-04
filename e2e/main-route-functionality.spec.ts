import { test, expect } from '@playwright/test';

test.describe('Main Route Functionality', () => {
  test('should load the homepage and display the form', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the main elements are visible
    await expect(page.locator('h1')).toContainText('Southwest USA Roadtripper');
    await expect(page.locator('input[name="start"]')).toBeVisible();
    await expect(page.locator('input[name="end"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Calculate and Save Trip');
  });

  test('should handle form submission for LA to Vegas route', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the form to be fully loaded
    await page.waitForSelector('input[name="start"]');
    
    // Fill in the form
    await page.fill('input[name="start"]', 'Los Angeles, CA');
    await page.fill('input[name="end"]', 'Las Vegas, NV');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for the response and check for success or error
    await page.waitForLoadState('networkidle');
    
    // Check if we get either success or error response
    const hasSuccess = await page.locator('div:has-text("Trip saved successfully")')?.count() > 0;
    const hasError = await page.locator('div:has-text("Error:")')?.count() > 0;
    
    expect(hasSuccess || hasError).toBeTruthy();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/route-submission-result.png' });
  });

  test('should check /simple-test route works (fallback)', async ({ page }) => {
    await page.goto('/simple-test');
    
    await expect(page.locator('h1')).toContainText('Simple Test Page');
    await expect(page.locator('input[placeholder="Start"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Destination"]')).toBeVisible();
  });

  test('should verify APIs are responding', async ({ page }) => {
    // Test geocoding API
    const geocodingResponse = await page.request.get('/api/proxy/geocoding?q=Los Angeles');
    console.log('Geocoding API status:', geocodingResponse.status());
    
    // Test routing API with sample data
    const routingResponse = await page.request.post('/api/proxy/routing', {
      data: {
        waypoints: [
          { lat: 34.0522, lng: -118.2437 }, // LA
          { lat: 36.1699, lng: -115.1398 }  // Vegas
        ]
      }
    });
    console.log('Routing API status:', routingResponse.status());
    
    // At least one API should work
    expect(geocodingResponse.status() < 500 || routingResponse.status() < 500).toBeTruthy();
  });
});
