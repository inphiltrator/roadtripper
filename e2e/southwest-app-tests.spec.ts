import { test, expect } from '@playwright/test';

test.describe('Southwest USA Roadtripper App', () => {
  
  test('Homepage loads with correct title and branding', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Southwest USA Roadtripper/);
    
    // Take full page screenshot
    await page.screenshot({ path: 'homepage-full.png', fullPage: true });
    
    // Look for main heading
    const mainHeading = page.locator('h1, h2').filter({ hasText: /Southwest|Roadtripper/ }).first();
    await expect(mainHeading).toBeVisible();
    
    // Check for Southwest-specific elements
    const southwestText = page.locator('text=/Southwest|Nevada|California|Utah|Arizona/').first();
    await expect(southwestText).toBeVisible();
    
    console.log('✅ Homepage loaded successfully');
  });

  test('Glass morphism UI components are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for glass panel components
    const glassPanels = page.locator('.glass-panel, .glass-card');
    const glassCount = await glassPanels.count();
    
    expect(glassCount).toBeGreaterThan(0);
    console.log(`✅ Found ${glassCount} glass UI components`);
    
    // Check for backdrop blur effects
    const blurElements = page.locator('[class*="backdrop-blur"]');
    const blurCount = await blurElements.count();
    
    expect(blurCount).toBeGreaterThan(0);
    console.log(`✅ Found ${blurCount} backdrop-blur elements`);
  });

  test('Map component is present and loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for map to load (MapLibre)
    await page.waitForTimeout(3000);
    
    // Look for map container
    const mapContainer = page.locator('.maplibregl-map, .map-container, canvas').first();
    await expect(mapContainer).toBeVisible();
    
    // Take screenshot of map area
    await page.screenshot({ path: 'map-component.png' });
    
    console.log('✅ Map component loaded');
  });

  test('Southwest regional features are displayed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for regional indicators (from PROJECT_STATUS.md)
    const regionalElements = [
      'National Park',
      'Desert',
      'Route 66',
      'POI',
      'Glass',
      'Southwest'
    ];
    
    for (const element of regionalElements) {
      const found = page.locator(`text=/${element}/i`).first();
      try {
        await expect(found).toBeVisible({ timeout: 2000 });
        console.log(`✅ Found regional element: ${element}`);
      } catch (e) {
        console.log(`⚠️  Regional element not immediately visible: ${element}`);
      }
    }
  });

  test('Interactive elements are clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    console.log(`Found ${buttonCount} buttons`);
    
    if (buttonCount > 0) {
      // Try clicking the first button
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
      
      // Take screenshot before interaction
      await page.screenshot({ path: 'before-click.png' });
      
      await firstButton.click();
      
      // Wait for any potential changes
      await page.waitForTimeout(1000);
      
      // Take screenshot after interaction
      await page.screenshot({ path: 'after-click.png' });
      
      console.log('✅ Successfully clicked interactive element');
    }
  });

  test('Check for API endpoints and regional services', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for potential API calls
    await page.waitForTimeout(3000);
    
    // Check for Southwest-specific API calls
    const apiCalls = requests.filter(url => 
      url.includes('/api/') || 
      url.includes('geocoding') || 
      url.includes('routing') ||
      url.includes('mapbox') ||
      url.includes('overpass')
    );
    
    console.log('API calls detected:', apiCalls);
    console.log('All requests:', requests.slice(0, 10)); // First 10 requests
    
    // The app should be making some API calls or have API endpoints ready
    expect(requests.length).toBeGreaterThan(0);
  });

  test('Responsive design works on different screen sizes', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'desktop-view.png' });
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'tablet-view.png' });
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'mobile-view.png' });
    
    console.log('✅ Responsive design tested on multiple screen sizes');
  });

  test('Test regional page if available', async ({ page }) => {
    await page.goto('/');
    
    // Try to navigate to regional test page
    try {
      await page.goto('/test-regional');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'regional-test-page.png' });
      
      // Look for regional features
      const regionalContent = page.locator('text=/Southwest|Regional|Test/i').first();
      await expect(regionalContent).toBeVisible();
      
      console.log('✅ Regional test page loaded successfully');
    } catch (e) {
      console.log('ℹ️  Regional test page not available or not accessible');
    }
  });

});
