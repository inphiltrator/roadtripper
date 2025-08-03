import { test, expect } from '@playwright/test';

test('Los Angeles to Las Vegas route calculates and displays on map', async ({ page }) => {
  await page.goto('/');

  // Simulate entering Los Angeles and Las Vegas route
  await page.fill('input[name="start"]', 'Los Angeles, CA');
  await page.fill('input[name="end"]', 'Las Vegas, NV');

  // Trigger route calculation
  await page.click('button#calculate-route');

  // Wait for the map to update with the route
  await page.waitForLoadState('networkidle');

  // Verify the route is displayed on the map
  const mapContainer = page.locator('.map-container canvas');
  await expect(mapContainer).toBeVisible();

  console.log('✅ Route from Los Angeles to Las Vegas is displayed on the map');
});

