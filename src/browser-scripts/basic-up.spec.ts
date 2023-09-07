import { test, expect } from "@playwright/test";

test("basic visit", async ({ page }) => {
  await page.goto("https://www.sherwin-williams.com");
  await page.waitForLoadState("networkidle");
  await page.screenshot();
});
