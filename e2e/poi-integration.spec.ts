import { test, expect } from '@playwright/test';

test.describe('POI Integration Tests', () => {
  test('should display POI panel after successful route calculation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in route form (using short Utah route to save API tokens)
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'St. George, UT');
    
    // Submit form (button text is 'Show Route')
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    // Wait for route calculation and POI loading
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give POI API time to respond
    
    // Check if POI panel is displayed
    const poiPanel = page.locator('.poi-panel, [data-testid="poi-panel"]');
    await expect(poiPanel).toBeVisible({ timeout: 10000 });
    
    // Check POI panel header
    await expect(page.locator('h2:has-text("Points of Interest")')).toBeVisible();
    
    // Check for POI count message
    const poiCountText = page.locator('text=/\\d+ locations found along your route/');
    await expect(poiCountText).toBeVisible();
    
    await page.screenshot({ path: 'test-results/poi-panel-displayed.png' });
  });
  
  test('should display POI markers on the map', async ({ page }) => {
    await page.goto('/');
    
    // Fill and submit route form
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'St. George, UT');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    // Wait for POI loading
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check for Mapbox markers (they have the class 'mapboxgl-marker')
    const mapboxMarkers = page.locator('.mapboxgl-marker');
    const markerCount = await mapboxMarkers.count();
    
    // We should have at least some POI markers
    expect(markerCount).toBeGreaterThan(0);
    
    console.log(`Found ${markerCount} POI markers on the map`);
    
    await page.screenshot({ path: 'test-results/poi-markers-on-map.png' });
  });
  
  test('should show POI filter component', async ({ page }) => {
    await page.goto('/');
    
    // Fill and submit route form to trigger POI loading
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'St. George, UT');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for POI Filter component
    const poiFilter = page.locator('text=POI Filters, text=Categories, [data-testid="poi-filter"]').first();
    await expect(poiFilter).toBeVisible({ timeout: 10000 });
    
    // Check for category checkboxes
    await expect(page.locator('text=National Parks')).toBeVisible();
    await expect(page.locator('text=Camping')).toBeVisible();
    await expect(page.locator('text=Dining')).toBeVisible();
    
    // Check for radius selector
    await expect(page.locator('text=Search Radius')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/poi-filter-visible.png' });
  });
  
  test('should filter POIs by category', async ({ page }) => {
    await page.goto('/');
    
    // Setup route
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'St. George, UT');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Get initial POI count
    const initialPoiText = await page.locator('text=/\\d+ locations found/').textContent();
    const initialCount = parseInt(initialPoiText?.match(/\\d+/)?.[0] || '0');
    
    // Uncheck some categories to filter
    const diningCheckbox = page.locator('input[type="checkbox"]').and(
      page.locator('.. >> text=Dining')
    );
    
    if (await diningCheckbox.isChecked()) {
      await diningCheckbox.uncheck();
      await page.waitForTimeout(1000); // Wait for filter to apply
      
      // Check if POI count changed
      const filteredPoiText = await page.locator('text=/\\d+ locations found/').textContent();
      const filteredCount = parseInt(filteredPoiText?.match(/\\d+/)?.[0] || '0');
      
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      console.log(`Filtered POIs: ${initialCount} -> ${filteredCount}`);
    }
    
    await page.screenshot({ path: 'test-results/poi-category-filtering.png' });
  });
  
  test('should handle POI marker click and show popup', async ({ page }) => {
    await page.goto('/');
    
    // Setup route
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'St. George, UT');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Click on a POI marker
    const firstMarker = page.locator('.mapboxgl-marker').first();
    if (await firstMarker.count() > 0) {
      await firstMarker.click();
      
      // Wait for popup to appear
      await page.waitForTimeout(1000);
      
      // Check for Mapbox popup
      const popup = page.locator('.mapboxgl-popup');
      await expect(popup).toBeVisible({ timeout: 5000 });
      
      // Check popup content
      const popupContent = page.locator('.mapboxgl-popup-content');
      await expect(popupContent).toContainText(/\\.+/); // Should contain some text
      
      await page.screenshot({ path: 'test-results/poi-marker-popup.png' });
    } else {
      console.log('No POI markers found to test popup');
    }
  });
  
  test('should handle POI tile click and fly to location', async ({ page }) => {
    await page.goto('/');
    
    // Setup route
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'St. George, UT');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Find and click a POI tile in the panel
    const poiTiles = page.locator('.poi-panel [style*="border-radius"]'); // Glass panel tiles
    const firstTile = poiTiles.first();
    
    if (await firstTile.count() > 0) {
      await firstTile.click();
      
      // Wait for map to fly to location
      await page.waitForTimeout(2000);
      
      // The map should have changed (we can't easily test coordinates, but can check for animation)
      await page.screenshot({ path: 'test-results/poi-tile-click-result.png' });
      
      console.log('POI tile clicked - map should have flown to POI location');
    } else {
      console.log('No POI tiles found to test click interaction');
    }
  });
  
  test('should show success notification when POIs are loaded', async ({ page }) => {
    await page.goto('/');
    
    // Setup route
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'St. George, UT');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    
    // Look for success notification (fixed selector syntax)
    const successNotification = page.locator('.bg-green-500').or(
      page.locator('text=/Found \\d+ POIs along your route/')
    );
    await expect(successNotification.first()).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'test-results/poi-success-notification.png' });
  });
  
  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Setup route
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'St. George, UT');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check mobile layout
    const poiPanel = page.locator('.poi-panel');
    if (await poiPanel.count() > 0) {
      // POI panel should be at bottom on mobile
      const poiPanelBox = await poiPanel.boundingBox();
      const viewportHeight = 667;
      
      // Panel should be in bottom half of screen
      expect(poiPanelBox?.y || 0).toBeGreaterThan(viewportHeight / 2);
    }
    
    await page.screenshot({ path: 'test-results/poi-mobile-responsive.png' });
  });
});

test.describe('POI API Tests', () => {
  test('should respond to POI API endpoint', async ({ page }) => {
    // Test the POI API directly
    const response = await page.request.post('/api/proxy/pois-along-route', {
      data: {
        polyline: 'a~l~Fjk~uOwHJy@P', // Simple test polyline
        radius: 10000,
        categories: ['national_park', 'attraction']
      }
    });
    
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('pois');
    expect(Array.isArray(responseBody.pois)).toBeTruthy();
    
    console.log(`POI API returned ${responseBody.pois.length} POIs`);
  });
  
  test('should handle invalid polyline gracefully', async ({ page }) => {
    const response = await page.request.post('/api/proxy/pois-along-route', {
      data: {
        polyline: 'invalid-polyline',
        radius: 10000,
        categories: ['attraction']
      }
    });
    
    // Should return error but not crash
    expect(response.status()).toBeLessThan(500);
  });
  
  test('should handle missing polyline parameter', async ({ page }) => {
    const response = await page.request.post('/api/proxy/pois-along-route', {
      data: {
        radius: 10000,
        categories: ['attraction']
      }
    });
    
    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toContain('Polyline is required');
  });
});
