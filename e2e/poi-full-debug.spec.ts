import { test, expect } from '@playwright/test';

test('Debug complete POI integration flow', async ({ page }) => {
  // Navigate to main page
  await page.goto('/');
  
  // Wait for page load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('=== FORM SUBMISSION ===');
  
  // Fill form (using POI-rich route)
  await page.fill('input[name="start"]', 'Los Angeles, CA');
  await page.fill('input[name="end"]', 'Las Vegas, NV');
  
  // Submit form and wait for response
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/') && response.request().method() === 'POST'
  );
  
  await page.click('button[type="submit"]:has-text("Show Route")');
  
  const response = await responsePromise;
  console.log('Form response status:', response.status());
  
  // Wait longer for processing
  await page.waitForTimeout(10000);
  
  console.log('=== PAGE STATE AFTER SUBMISSION ===');
  
  // Check for success message
  const successMsg = page.locator('div:has-text("Trip saved successfully!")');
  const successVisible = await successMsg.count() > 0;
  console.log('Success message visible:', successVisible);
  
  // Check for error message
  const errorMsg = page.locator('div:has-text("Error:")');
  const errorVisible = await errorMsg.count() > 0;
  console.log('Error message visible:', errorVisible);
  if (errorVisible) {
    const errorText = await errorMsg.textContent();
    console.log('Error text:', errorText);
  }
  
  // Check for POI panel
  const poiPanel = page.locator('.poi-panel, [data-testid="poi-panel"]');
  const poiPanelCount = await poiPanel.count();
  console.log('POI panel count:', poiPanelCount);
  
  // Check for POI notification
  const notification = page.locator('div:has-text("Found") >> text=/Found \\d+ POIs/');
  const notificationCount = await notification.count();
  console.log('POI notification count:', notificationCount);
  if (notificationCount > 0) {
    const notificationText = await notification.textContent();
    console.log('Notification text:', notificationText);
  }
  
  // Check for "Points of Interest" header
  const poiHeader = page.locator('h2:has-text("Points of Interest")');
  const poiHeaderCount = await poiHeader.count();
  console.log('POI header count:', poiHeaderCount);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/poi-full-debug.png', fullPage: true });
  
  console.log('=== DOM INSPECTION ===');
  
  // Look for any elements with "poi" in class or id
  const poiElements = page.locator('[class*="poi"], [id*="poi"]');
  const poiElementCount = await poiElements.count();
  console.log('Elements with "poi" in class/id:', poiElementCount);
  
  // Look for any elements with POI-related text
  const poiText = page.locator('text=/poi|POI|Points of Interest|locations found/i');
  const poiTextCount = await poiText.count();
  console.log('Elements with POI-related text:', poiTextCount);
});
