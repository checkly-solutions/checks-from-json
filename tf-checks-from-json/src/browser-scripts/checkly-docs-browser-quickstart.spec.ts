import { test, expect } from '@playwright/test';

test('Checkly Browser Check Quickstart Page', async ({ page }) => {
  // Navigate to the Browser Check quickstart guide
  await page.goto('https://checklyhq.com/docs/quickstarts/browser-check');

  // Verify page loads successfully
  await expect(page).toHaveTitle(/Creating A Browser Check/);

  // Check main heading is visible
  const mainHeading = page.locator('h1:has-text("Creating A Browser Check")');
  await expect(mainHeading).toBeVisible();

  // Verify key sections are present
  const prerequisitesSection = page.locator('text=Prerequisites');
  await expect(prerequisitesSection).toBeVisible();

  // Check that numbered steps are present (7 steps in the guide)
  const step1 = page.locator('text=Create a Browser Check');
  const step2 = page.locator('text=Edit Your Test Script');
  const step7 = page.locator('text=View Results');

  await expect(step1).toBeVisible();
  await expect(step2).toBeVisible();
  await expect(step7).toBeVisible();

  // Verify important links are present
  const capabilitiesLink = page.locator('a:has-text("Browser Check capabilities")');
  await expect(capabilitiesLink).toBeVisible();

  // Verify navigation menu is functional
  const docsLink = page.locator('a[href="/docs/what-is-checkly"]:has-text("Docs")');
  await expect(docsLink).toBeVisible();

  // Check that Next Steps section exists
  const nextStepsHeading = page.locator('text=Next Steps');
  await expect(nextStepsHeading).toBeVisible();

  // Final assertion - page should be functional
  expect(page.url()).toBe('https://www.checklyhq.com/docs/quickstarts/browser-check/');
});
