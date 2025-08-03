import { test, expect } from '@playwright/test';

test.describe('Trip Management', () => {
  const startLocation = 'Phoenix, AZ';
  const endLocation = 'Grand Canyon';
  const tripName = `${startLocation} to ${endLocation}`;

  test('should allow creating a trip and viewing it on the dashboard', async ({ page }) => {
    // Listen for all console events and log them to the test output
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} ${msg.text()}`));

    // Step 1: Navigate to the main page and create a new trip
    await page.goto('/');
    await page.fill('input[name="start"]', startLocation);
    await page.fill('input[name="end"]', endLocation);
    await page.click('button#calculate-route');

    // Verify that the trip was saved successfully
    const successMessage = page.locator('text=Trip saved successfully!');
    await expect(successMessage).toBeVisible();

    // Step 2: Navigate to the dashboard
    await page.click('a[href="/dashboard"] >> text=My Trips');

    // Step 3: Verify the new trip is listed on the dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page).toHaveTitle('My Trips');

    const tripEntry = page.locator(`h2:has-text("${tripName}")`);
    await expect(tripEntry).toBeVisible();

    console.log(`✅ Test successful: Verified that trip "${tripName}" was created and is visible on the dashboard.`);
  });
});

