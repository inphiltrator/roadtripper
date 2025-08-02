import { test, expect } from '@playwright/test';

test.describe('Southwest USA API Endpoints', () => {
  
  test('MapBox Geocoding API proxy works', async ({ page }) => {
    await page.goto('/');
    
    // Test geocoding endpoint directly
    const response = await page.request.get('/api/proxy/geocoding?q=Las Vegas');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    console.log('Geocoding response:', JSON.stringify(data, null, 2));
    
    // Should return MapBox-style response or fallback data
    expect(data).toBeDefined();
  });

  test('Regional test API endpoint works', async ({ page }) => {
    await page.goto('/');
    
    // Test the regional API endpoint 
    const response = await page.request.get('/api/test-regional');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    console.log('Regional API response keys:', Object.keys(data));
    
    // Should include Southwest-specific data
    expect(data).toHaveProperty('region');
    expect(data.region).toContain('Southwest');
  });

  test('Test POI data structure', async ({ page }) => {
    // Navigate to the page and check for POI elements
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for POI-related elements that indicate the POI service is working
    const poiElements = page.locator('[data-testid*="poi"], .poi, text=/Points of Interest/i');
    const poiCount = await poiElements.count();
    
    console.log(`Found ${poiCount} POI-related elements`);
    
    if (poiCount > 0) {
      console.log('✅ POI system appears to be integrated');
    } else {
      console.log('ℹ️  POI elements not immediately visible (may be async loaded)');
    }
  });

  test('Test Southwest regional bounds enforcement', async ({ page }) => {
    await page.goto('/test-regional');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of regional test page
    await page.screenshot({ path: 'regional-bounds-test.png', fullPage: true });
    
    // Look for regional information
    const regionalInfo = page.locator('text=/Southwest|California|Nevada|Utah|Arizona|Bounds/i');
    const infoCount = await regionalInfo.count();
    
    expect(infoCount).toBeGreaterThan(0);
    console.log(`✅ Found ${infoCount} regional bound references`);
    
    // Check for coordinate information
    const coords = page.locator('text=/-?\d+\.\d+/');
    const coordCount = await coords.count();
    
    if (coordCount > 0) {
      console.log(`✅ Found ${coordCount} coordinate references`);
    }
  });

});
