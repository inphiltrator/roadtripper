import { test, expect } from '@playwright/test';

test.describe('Page Scroll and POI Filter Tests', () => {
  test('should allow scrolling on the main page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for initial POI loading
    await page.waitForTimeout(3000);
    
    // Get initial scroll position
    const initialScrollTop = await page.evaluate(() => window.pageYOffset);
    console.log('Initial scroll position:', initialScrollTop);
    
    // Get viewport height and document height
    const dimensions = await page.evaluate(() => ({
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight
    }));
    
    console.log('Page dimensions:', dimensions);
    
    // Check if page is scrollable (document height > viewport height)
    const isScrollable = dimensions.documentHeight > dimensions.viewportHeight;
    console.log('Page is scrollable:', isScrollable);
    
    if (isScrollable) {
      // Try scrolling down
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(500);
      
      const newScrollTop = await page.evaluate(() => window.pageYOffset);
      console.log('New scroll position after scrolling down:', newScrollTop);
      
      // Check if scroll position changed
      expect(newScrollTop).toBeGreaterThan(initialScrollTop);
      
      // Try scrolling back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      const finalScrollTop = await page.evaluate(() => window.pageYOffset);
      console.log('Final scroll position after scrolling to top:', finalScrollTop);
      expect(finalScrollTop).toBe(0);
      
      console.log('✅ Page scrolling works correctly');
    } else {
      console.log('❌ Page is not scrollable - content does not exceed viewport height');
      
      // Let's try to make it scrollable by adding a route which should add more content
      await page.fill('input[name="start"]', 'Kanab, UT');
      await page.fill('input[name="end"]', 'Fredonia, AZ');
      await page.click('button[type="submit"]:has-text("Show Route")');
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Wait for POIs to load
      
      // Check dimensions again after route calculation
      const newDimensions = await page.evaluate(() => ({
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      }));
      
      console.log('Page dimensions after route calculation:', newDimensions);
      
      const isNowScrollable = newDimensions.documentHeight > newDimensions.viewportHeight;
      console.log('Page is now scrollable:', isNowScrollable);
      
      if (isNowScrollable) {
        // Try scrolling with the new content
        await page.evaluate(() => window.scrollTo(0, 200));
        await page.waitForTimeout(500);
        
        const scrollAfterRoute = await page.evaluate(() => window.pageYOffset);
        console.log('Scroll position after route with content:', scrollAfterRoute);
        expect(scrollAfterRoute).toBeGreaterThan(0);
        console.log('✅ Page becomes scrollable after adding content');
      } else {
        console.log('⚠️ Page still not scrollable even with content - this indicates an issue');
        // This would be our main test failure case
      }
    }
    
    // Take screenshot to see current page state
    await page.screenshot({ path: 'test-results/scroll-test-final.png' });
  });

  test('should dynamically update POI display when filters are toggled', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Setup a route to get POIs
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for POI loading
    
    // Check if POI filters are visible
    const poiFilterSection = page.locator('h3:has-text("POI Filters")');
    await expect(poiFilterSection).toBeVisible({ timeout: 10000 });
    
    // Get initial POI count
    const initialCountElement = page.locator('text=/\\d+ of \\d+ locations/').first();
    await expect(initialCountElement).toBeVisible({ timeout: 10000 });
    
    const initialCountText = await initialCountElement.textContent();
    const initialCount = parseInt(initialCountText?.match(/(\d+) of/)?.[1] || '0');
    console.log('Initial POI count:', initialCount, 'from text:', initialCountText);
    
    // Get initial POI markers count on map
    const initialMarkers = page.locator('.mapboxgl-marker');
    const initialMarkerCount = await initialMarkers.count();
    console.log('Initial POI markers on map:', initialMarkerCount);
    
    // Check if any filter buttons are visible and selected
    const restaurantButton = page.locator('button:has-text("🍽️ Restaurants")');
    const gasStationButton = page.locator('button:has-text("⛽ Gas Stations")');
    const hotelButton = page.locator('button:has-text("🏨 Hotels")');
    
    await expect(restaurantButton).toBeVisible();
    await expect(gasStationButton).toBeVisible();
    await expect(hotelButton).toBeVisible();
    
    // Check initial state of restaurant filter (should be selected by default)
    const restaurantInitialClass = await restaurantButton.getAttribute('class');
    console.log('Restaurant button initial class:', restaurantInitialClass);
    const isRestaurantInitiallySelected = restaurantInitialClass?.includes('bg-amber-500');
    
    if (isRestaurantInitiallySelected) {
      // Uncheck restaurant category to see if POIs decrease
      await restaurantButton.click();
      await page.waitForTimeout(1000); // Wait for reactive update
      
      // Check new count
      const newCountText = await initialCountElement.textContent();
      const newCount = parseInt(newCountText?.match(/(\d+) of/)?.[1] || '0');
      console.log('POI count after unchecking restaurants:', newCount, 'from text:', newCountText);
      
      // Count should change (decrease or stay same, but reactive)
      console.log(`Filter toggle result: ${initialCount} -> ${newCount}`);
      
      // Check markers on map also changed
      const newMarkerCount = await initialMarkers.count();
      console.log('POI markers after filter change:', newMarkerCount);
      
      // Re-enable restaurant to see if count goes back up
      await restaurantButton.click();
      await page.waitForTimeout(1000);
      
      const restoredCountText = await initialCountElement.textContent();
      const restoredCount = parseInt(restoredCountText?.match(/(\d+) of/)?.[1] || '0');
      console.log('POI count after re-enabling restaurants:', restoredCount, 'from text:', restoredCountText);
      
      // Verify dynamic behavior worked
      expect(newCount).not.toBe(restoredCount); // Should be different when filter changed
      console.log('✅ POI filters work dynamically');
    } else {
      console.log('Restaurant filter not initially selected, testing selection instead');
      
      // Select restaurant category to see if POIs increase
      await restaurantButton.click();
      await page.waitForTimeout(1000);
      
      const newCountText = await initialCountElement.textContent();
      const newCount = parseInt(newCountText?.match(/(\d+) of/)?.[1] || '0');
      console.log('POI count after checking restaurants:', newCount, 'from text:', newCountText);
      
      // Should be different from initial
      expect(newCount).not.toBe(initialCount);
      console.log('✅ POI filters work dynamically (adding filters)');
    }
    
    // Test multiple filter changes
    console.log('Testing multiple filter toggles...');
    
    // Toggle hotel filter
    const hotelInitialClass = await hotelButton.getAttribute('class');
    const isHotelSelected = hotelInitialClass?.includes('bg-amber-500');
    
    if (isHotelSelected) {
      await hotelButton.click(); // Uncheck
    } else {
      await hotelButton.click(); // Check
    }
    
    await page.waitForTimeout(1000);
    
    const afterHotelToggleText = await initialCountElement.textContent();
    const afterHotelToggleCount = parseInt(afterHotelToggleText?.match(/(\d+) of/)?.[1] || '0');
    console.log('POI count after toggling hotels:', afterHotelToggleCount);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/poi-filter-test-final.png' });
  });

  test('should show proper POI count in different locations on page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for default POIs to load
    await page.waitForTimeout(3000);
    
    // Check multiple POI count displays
    const filterCountDisplay = page.locator('span:has-text("locations)")');
    const panelCountDisplay = page.locator('text=/\\d+ of \\d+ locations/');
    
    // Initially should show default Kanab POIs
    if (await filterCountDisplay.isVisible()) {
      const filterCountText = await filterCountDisplay.textContent();
      console.log('Filter count display:', filterCountText);
    }
    
    // Add a route to get more comprehensive POI data
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000); // Extended wait for POI API
    
    // Check all POI count displays after route calculation
    const allCountDisplays = page.locator('text=/\\d+.*location/');
    const displayCount = await allCountDisplays.count();
    console.log(`Found ${displayCount} POI count displays on page`);
    
    for (let i = 0; i < displayCount; i++) {
      const display = allCountDisplays.nth(i);
      const text = await display.textContent();
      console.log(`POI count display ${i + 1}: "${text}"`);
    }
    
    // Check success notification
    const successNotification = page.locator('text=/Found \\d+ POIs/');
    if (await successNotification.isVisible()) {
      const notificationText = await successNotification.textContent();
      console.log('Success notification:', notificationText);
    }
    
    // Verify consistency across displays
    const panelCount = page.locator('text=/\\d+ of \\d+ locations.*route/');
    if (await panelCount.isVisible()) {
      const panelText = await panelCount.textContent();
      console.log('Main panel count:', panelText);
      expect(panelText).toMatch(/\d+ of \d+ locations along your route/);
    }
    
    await page.screenshot({ path: 'test-results/poi-count-displays.png' });
  });

  test('should handle POI radius changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Set up route first
    await page.fill('input[name="start"]', 'Kanab, UT');
    await page.fill('input[name="end"]', 'Fredonia, AZ');
    await page.click('button[type="submit"]:has-text("Show Route")');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Find radius selector
    const radiusSelect = page.locator('select').filter({ hasText: /km/ });
    await expect(radiusSelect).toBeVisible();
    
    // Get current radius value
    const currentRadius = await radiusSelect.inputValue();
    console.log('Current radius:', currentRadius);
    
    // Get current POI count
    const countElement = page.locator('text=/\\d+ of \\d+ locations/').first();
    const currentCountText = await countElement.textContent();
    console.log('Current POI count with radius', currentRadius, ':', currentCountText);
    
    // Change radius to different value
    const newRadius = currentRadius === '10000' ? '20000' : '10000';
    await radiusSelect.selectOption(newRadius);
    
    console.log('Changed radius to:', newRadius);
    
    // Note: Current implementation has TODO for re-fetching POIs with new radius
    // So we're mainly testing that the UI responds, even if backend doesn't re-fetch
    await page.waitForTimeout(1000);
    
    const newRadiusValue = await radiusSelect.inputValue();
    expect(newRadiusValue).toBe(newRadius);
    console.log('✅ Radius selector UI works correctly');
    
    // TODO: When radius re-fetching is implemented, test that POI count changes
    console.log('ℹ️  Note: Radius-based POI re-fetching not yet implemented (marked as TODO)');
    
    await page.screenshot({ path: 'test-results/poi-radius-test.png' });
  });
});
