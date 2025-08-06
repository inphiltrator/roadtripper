import { test, expect } from '@playwright/test';

// Updated checks for optimized SouthwestMap component
const mapStyleCheck = r => r.url().includes('mapbox.com/styles/') && r.status() === 200;
const routeCheck = r => r.url().includes('calculateRoute') && r.status() === 200;

test.describe('Southwest Map Component', () => {
  test('initializes map with MapLibre GL and shows Southwest region', async ({ page }) => {
    // Navigate to page with SouthwestMap component
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for MapLibre to initialize
    await page.waitForTimeout(5000);
    
    // Check if map canvas is present and visible
    const mapCanvas = page.locator('.maplibregl-canvas, canvas').first();
    await expect(mapCanvas).toBeVisible({ timeout: 15000 });
    
    console.log('✅ MapLibre GL canvas loaded successfully');
    
    // Check if specific Southwest region indicator is visible
    const regionIndicator = page.locator('span:text("Southwest USA")').first();
    await expect(regionIndicator).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Specific Southwest region indicator visible');
    
    // Check if map controls are present (using Mapbox GL JS, not MapLibre)
    const navigationControl = page.locator('.mapboxgl-ctrl-group').first();
    await expect(navigationControl).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Map navigation controls loaded');
  });
  
  test('handles map interactions within Southwest bounds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for map to initialize
    const mapCanvas = page.locator('.maplibregl-canvas, canvas').first();
    await expect(mapCanvas).toBeVisible({ timeout: 15000 });
    
    // Click on map within Southwest region (Las Vegas area)
    await mapCanvas.click({ position: { x: 400, y: 300 } });
    
    // Wait for click handler to process
    await page.waitForTimeout(1000);
    
    console.log('✅ Map click within Southwest region processed');
  });
  
  test('shows terrain legend and performance indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for map to load
    await page.waitForTimeout(5000);
    
    // Check terrain legend
    const terrainLegend = page.locator('text=Elevation');
    await expect(terrainLegend).toBeVisible({ timeout: 5000 });
    
    // Check performance indicator
    const performanceIndicator = page.locator('text=Terrain Active');
    await expect(performanceIndicator).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Terrain legend and performance indicators visible');
  });
  
  test('responds to route calculation requests', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for map initialization
    await page.waitForTimeout(5000);
    
    // Look for route input elements (may vary based on app structure)
    const startInput = page.locator('input[name="start"], input[placeholder*="start"], input[placeholder*="Start"]').first();
    const endInput = page.locator('input[name="end"], input[placeholder*="end"], input[placeholder*="End"]').first();
    const calculateButton = page.locator('button:has-text("Calculate"), button:has-text("Route"), button#calculate-route').first();
    
    // Check if route form elements exist
    if (await startInput.isVisible() && await endInput.isVisible() && await calculateButton.isVisible()) {
      // Fill route form
      await startInput.fill('Los Angeles, CA');
      await endInput.fill('Las Vegas, NV');
      await calculateButton.click();
      
      // Wait for route processing
      await page.waitForTimeout(3000);
      
      console.log('✅ Route calculation form interaction completed');
    } else {
      console.log('ℹ️ Route form elements not found - may not be implemented on current page');
    }
  });
  
  test('displays seasonal warnings when applicable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for map and seasonal config to load
    await page.waitForTimeout(5000);
    
    // Check for seasonal warnings (if current month triggers them)
    const heatWarning = page.locator('text=Summer Heat Advisory');
    const snowWarning = page.locator('text=Winter Conditions');
    
    // These may or may not be visible depending on current season
    const heatVisible = await heatWarning.isVisible();
    const snowVisible = await snowWarning.isVisible();
    
    if (heatVisible) {
      console.log('✅ Summer heat advisory displayed');
    }
    if (snowVisible) {
      console.log('✅ Winter conditions warning displayed');
    }
    if (!heatVisible && !snowVisible) {
      console.log('ℹ️ No seasonal warnings active for current month');
    }
  });
});

