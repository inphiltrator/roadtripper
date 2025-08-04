import { test, expect } from '@playwright/test';

test.describe('Debug Trip Page', () => {
  test('should debug what is rendered on /trip page', async ({ page }) => {
    // Navigate to the trip planning page
    await page.goto('/simple-test');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get page title to see what's actually loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get the HTML content to see what's rendered
    const content = await page.content();
    console.log('Page content length:', content.length);
    
    // Check if our expected elements exist
    const hasStartInput = await page.locator('input[placeholder="Start"]').count() > 0;
    const hasDestinationInput = await page.locator('input[placeholder="Destination"]').count() > 0;
    const hasMapContainer = await page.locator('.map-container').count() > 0;
    const hasTripPlannerClass = await page.locator('.trip-planner').count() > 0;
    
    console.log('Has Start input:', hasStartInput);
    console.log('Has Destination input:', hasDestinationInput);
    console.log('Has map container:', hasMapContainer);
    console.log('Has trip planner class:', hasTripPlannerClass);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-trip-page.png' });
    
    // Get all input elements to see what's actually there
    const inputs = await page.locator('input').all();
    console.log('Number of input elements found:', inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      console.log(`Input ${i}: type=${type}, placeholder=${placeholder}`);
    }
    
    // Check if we're getting redirected or something
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Look for any error messages in the console
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Check if there are any network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('Network error:', response.status(), response.url());
      }
    });
  });
});
