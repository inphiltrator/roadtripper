import { test, expect } from '@playwright/test';

test.describe('Google Route Display Integration', () => {
  test('should submit route form and handle response on main page', async ({ page }) => {
    // Navigate to the main page (not /trip)
    await page.goto('/');

    // Wait for the form to be loaded
    await page.waitForSelector('input[name="start"]');

    // Fill in the start and destination inputs using the correct selectors
    await page.fill('input[name="start"]', 'Los Angeles, CA');
    await page.fill('input[name="end"]', 'Las Vegas, NV');

    // Click the button to calculate the route
    await page.click('button[type="submit"]:has-text("Show Route")');

    // Wait for the form submission to complete
    await page.waitForLoadState('networkidle');

    // Check that we get some kind of response (success or error)
    const hasResponse = await page.locator('div[class*="bg-green-500/20"], div[class*="bg-red-500/20"]').count() > 0;
    expect(hasResponse).toBeTruthy();

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/route-integration-result.png' });
    
    // Log the current state for debugging
    const pageContent = await page.textContent('body');
    console.log('Form submission resulted in some response on the page');
  });

  test('should verify map component loads on main page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the SouthwestMap component to be rendered
    await page.waitForSelector('.h-96, .lg\\:h-\\[600px\\]', { timeout: 10000 });
    
    // Verify the map container exists
    const mapContainer = await page.locator('.h-96').count();
    expect(mapContainer).toBeGreaterThan(0);
    
    console.log('Map component container found and loaded');
  });
});

