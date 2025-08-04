import { test, expect } from '@playwright/test';

test.describe('Trip Management', () => {
  const startLocation = 'Phoenix, AZ';
  const endLocation = 'Scottsdale, AZ';
  const tripName = `${startLocation} to ${endLocation}`;

  test('should allow creating a trip and viewing it on the dashboard', async ({ page }) => {
    // Listen for all console events and log them to the test output
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} ${msg.text()}`));

    // Step 1: Navigate to the main page and create a new trip
    await page.goto('/');
    await page.fill('input[name="start"]', startLocation);
    await page.fill('input[name="end"]', endLocation);
    await page.click('button#calculate-route');

    // Wait for the route calculation to complete, then navigate to the dashboard
    await page.waitForURL('**/calculateRoute**');
    await page.click('a[href="/dashboard"]');

    // Verify the new trip is listed on the dashboard
    await expect(page).toHaveURL('/dashboard');
const tripEntry = page.locator(`h2:has-text("${tripName}")`).first();
    await expect(tripEntry).toBeVisible({ timeout: 15000 });

    console.log(`✅ Test successful: Verified that trip "${tripName}" was created and is visible on the dashboard.`);
  });
});

