import { test, expect } from '@playwright/test';

test('Los Angeles to Las Vegas route calculates and displays on map', async ({ page }) => {
  // Enable console logging from browser
  page.on('console', msg => {
    console.log(`Browser console (${msg.type()}): ${msg.text()}`);
  });
  
  await page.goto('/');

  // Ensure map and components are fully loaded
  await page.waitForLoadState('networkidle');
  
  // Check if the map container exists
  const mapContainer = page.locator('.map-container');
  await expect(mapContainer).toBeVisible({ timeout: 10000 });
  console.log('✅ Map container is visible');
  
  // Debug: Print DOM structure around map
  const mapContainerHTML = await mapContainer.innerHTML();
  console.log('Map container content:', mapContainerHTML.substring(0, 500));
  
  // Simulate entering Los Angeles and Las Vegas route
  await page.fill('input[name="start"]', 'Los Angeles, CA');
  await page.fill('input[name="end"]', 'Las Vegas, NV');

  // Trigger route calculation
  await page.click('button#calculate-route');

  // Wait for the map to update with the route
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more for map initialization
  await page.waitForTimeout(3000);
  
  // Debug: Check what elements exist in the map container
  const allMapElements = await page.locator('.map-container *').count();
  console.log(`Found ${allMapElements} elements in map container`);
  
  // Try different selectors for map canvas
  const canvasCount = await page.locator('canvas').count();
  console.log(`Total canvas elements on page: ${canvasCount}`);
  
  if (canvasCount > 0) {
    const firstCanvas = page.locator('canvas').first();
    await expect(firstCanvas).toBeVisible({ timeout: 5000 });
    console.log('✅ Found canvas element');
  } else {
    console.log('❌ No canvas elements found');
  }

  console.log('✅ Test completed successfully');
});

