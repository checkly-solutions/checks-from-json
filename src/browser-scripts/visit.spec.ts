import { test, expect } from '@playwright/test';

test('does a simple visit and confirms the title and that it looks correct', async ({ page }) => {
  test.setTimeout(60000);

  console.log('https://next-danube-webshop.vercel.app', 'pageUrl');

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

  await page.waitForTimeout(1000);

  // npx checkly test --update-snapshots
  await expect(page).toHaveScreenshot();
});
