import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('https://next-danube-webshop.vercel.app');

  const response = await page.waitForResponse(
    `https://next-danube-webshop-backend.vercel.app/api/v1/books`
  );

  if (response.status() !== 200) {
    console.log(response.status());
    throw new Error(`Request failed with status ${response.status()}`);
  }
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveTitle(/Checkly Webshop/);
});
