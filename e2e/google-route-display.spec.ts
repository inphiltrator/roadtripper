import { test, expect } from '@playwright/test';

test.describe('Google Route Display on Mapbox Map', () => {
  test('should display a route on the map after entering start and destination', async ({ page }) => {
    // Navigate to the trip planning page
    await page.goto('/trip');

    // Fill in the start and destination inputs
    await page.fill('input[placeholder="Start"]', 'Los Angeles');
    await page.fill('input[placeholder="Destination"]', 'Las Vegas');

    // Click the button to calculate the route
    await page.click('button:has-text("Calculate Route")');

    // Wait for the route to be displayed on the map by looking for the source
    await page.waitForFunction(() => {
      // @ts-ignore
      return window.map.getSource('route') !== undefined;
    });

    // Assert that a path element (the route) is visible on the map
    const routeLayer = await page.evaluate(() => {
      // @ts-ignore
      return window.map.getLayer('route');
    });

    expect(routeLayer).toBeDefined();
  });
});

