import { test, expect } from "@playwright/test";

test("find a store", async ({ page }) => {
  test.slow();

  await page.goto("https://www.sherwin-williams.com/");
  const page1Promise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Find A Store" }).click();
  const page1 = await page1Promise;
  await page1.waitForTimeout(3000);
  await page1.getByPlaceholder("City, State and/or Postal Code").click();
  await page1.getByPlaceholder("City, State and/or Postal Code").fill("31404");
  await page1.waitForTimeout(3000);
  await page1.getByPlaceholder("City, State and/or Postal Code").press("Enter");
  await page1.waitForLoadState("networkidle");
  await page1
    .getByRole("listitem")
    .filter({
      hasText: "1.462 Miles SAVANNAH-MAIN #702345 2135 E Victory Dr # A-2 Savannah, GA, 31404-39",
    })
    .getByRole("button", { name: "Select Store" })
    .click();
  await page1.waitForTimeout(3000);
  await page1.getByRole("link", { name: "SAVANNAH-MAIN #702345" }).click();
});
