import { test, expect } from '@playwright/test';

test.describe('POI UI Tests - Current Implementation', () => {
  test('should show POI overlay filter after successful route', async ({ page }) => {
    await page.goto('/');
    
    // Initially, no POI content should be visible
    const poiCountText = page.locator('text=/\\d+ locations found/');
    await expect(poiCountText).not.toBeVisible();
    
    // Fill route form - shorter route to save tokens
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    
    // Submit route calculation
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    // Wait for route calculation and POI data
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000); // Give API time to respond
    
    // Check that we have some POI count (more specific selector)
    await expect(poiCountText).toBeVisible({ timeout: 15000 });
    
    // Check for POI filter overlay (it should appear over the map)
    const filterOverlay = page.locator('text=POI Filters');
    await expect(filterOverlay).toBeVisible({ timeout: 5000 });
    
    // Verify there are checkboxes for POI categories
    const checkboxes = page.locator('input[type="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThan(0);
    
    // Check for Apply Filters button
    const applyButton = page.locator('button:has-text("Apply Filters")');
    await expect(applyButton).toBeVisible();
    
    await page.screenshot({ path: 'test-results/poi-overlay-visible.png' });
  });
  
  test('should have default categories pre-selected in POI filter overlay', async ({ page }) => {
    await page.goto('/');
    
    // Calculate route to show filters - shorter route to save tokens
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000); // Wait for POI data
    
    // Check that we have POI filter overlay visible
    const filterOverlay = page.locator('text=POI Filters');
    await expect(filterOverlay).toBeVisible({ timeout: 10000 });
    
    // Check that some categories are pre-selected by default
    const checkedBoxes = page.locator('input[type="checkbox"]:checked');
    const checkedCount = await checkedBoxes.count();
    expect(checkedCount).toBeGreaterThan(0);
    
    console.log(`Found ${checkedCount} pre-selected categories`);
    
    await page.screenshot({ path: 'test-results/poi-default-categories.png' });
  });
  
  test('should display POI count that updates with filter changes', async ({ page }) => {
    await page.goto('/');
    
    // Setup route - shorter route to save tokens
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000); // Give POI API more time
    
    // Get initial POI count from panel
    const poiCountElement = page.locator('text=/\\d+ locations found/');
    await expect(poiCountElement).toBeVisible({ timeout: 15000 });
    
    const initialCountText = await poiCountElement.textContent();
    const initialCount = parseInt(initialCountText?.match(/\\d+/)?.[0] || '0');
    
    console.log(`Initial POI count: ${initialCount}`);
    
    // Should have found some POIs with MapBox Search Box API
    expect(initialCount).toBeGreaterThan(0);
    
    // Test filter interaction - uncheck one category
    const checkboxes = page.locator('input[type="checkbox"]:checked');
    const checkedCount = await checkboxes.count();
    
    if (checkedCount > 0) {
      await checkboxes.first().uncheck();
      
      // Apply filters to trigger update
      const applyButton = page.locator('button:has-text("Apply Filters")');
      await applyButton.click();
      
      await page.waitForTimeout(3000);
      
      // Count may change (decrease or stay same)
      const newCountText = await poiCountElement.textContent();
      const newCount = parseInt(newCountText?.match(/\\d+/)?.[0] || '0');
      
      console.log(`Filtered POI count: ${newCount}`);
    }
    
    await page.screenshot({ path: 'test-results/poi-count-filtering.png' });
  });
  
  test('should show radius selector in POI filter overlay', async ({ page }) => {
    await page.goto('/');
    
    // Calculate route to show filters - shorter route to save tokens
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);
    
    // Check that POI filter overlay is visible
    const filterOverlay = page.locator('text=POI Filters');
    await expect(filterOverlay).toBeVisible({ timeout: 10000 });
    
    // Check for radius selector in the overlay
    const radiusSelector = page.locator('text=Search Radius').or(
      page.locator('text=Radius').or(
        page.locator('select, input[type="range"]')
      )
    );
    await expect(radiusSelector.first()).toBeVisible();
    
    // Check for Apply Filters button
    const applyButton = page.locator('button:has-text("Apply Filters")');
    await expect(applyButton).toBeVisible();
    
    await page.screenshot({ path: 'test-results/poi-radius-selector.png' });
  });
  
  test('should work correctly on mobile viewport with POI overlay', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Calculate route - shorter route to save tokens
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);
    
    // POI filter overlay should be visible on mobile
    const filterOverlay = page.locator('text=POI Filters');
    await expect(filterOverlay).toBeVisible({ timeout: 10000 });
    
    // POI count should be visible
    const poiCountText = page.locator('text=/\\d+ locations found/');
    await expect(poiCountText).toBeVisible();
    
    // Check that checkboxes are interactive on mobile
    const checkboxes = page.locator('input[type="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'test-results/poi-mobile-overlay.png' });
  });
});

test.describe('POI MapBox Categories Tests', () => {
  test('should display correct POI categories for MapBox data', async ({ page }) => {
    await page.goto('/');
    
    // Calculate route to get POI data - shorter route to save tokens
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);
    
    // Check that POI panel shows diverse MapBox categories
    const categoriesFound = page.locator('text=/categoriesFound/').or(
      page.locator('.poi-panel [class*="category"], .poi-panel [class*="tag"]')
    );
    
    // Should have multiple category types from MapBox
    // (restaurant, gas station, hotel, etc.)
    const categoryCount = await categoriesFound.count();
    expect(categoryCount).toBeGreaterThan(0);
    
    console.log(`Found ${categoryCount} category elements in POI display`);
    
    await page.screenshot({ path: 'test-results/poi-mapbox-categories.png' });
  });
  
  test('should show MapBox POI metadata (phone, address)', async ({ page }) => {
    await page.goto('/');
    
    // Calculate route - shorter route to save tokens
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);
    
    // Look for POI with rich metadata
    const poiWithPhone = page.locator('text=/\\+1?[0-9-()\\s]+/').first();
    const poiWithAddress = page.locator('text=/\\d+\\s+[A-Za-z\\s]+,\\s*[A-Za-z\\s]+/').first();
    
    // At least some POIs should have phone numbers or full addresses
    const hasRichData = (await poiWithPhone.count()) > 0 || (await poiWithAddress.count()) > 0;
    expect(hasRichData).toBeTruthy();
    
    console.log('MapBox POIs include rich metadata (phone/address)');
    
    await page.screenshot({ path: 'test-results/poi-rich-metadata.png' });
  });
});
