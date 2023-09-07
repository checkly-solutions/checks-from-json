import { test, expect } from "@playwright/test";

test("login account", async ({ page }) => {
  await page.goto("https://www.sherwin-williams.com/");
  await page.getByRole("link", { name: "Sign in Link" }).click();
  await page.getByLabel("Email*").fill("jonathan+sherwin@checklyhq.com");
  await page.getByLabel("Password*").fill("sherwinPasssword!");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(
    "https://www.sherwin-williams.com/AjaxLogonForm?storeId=10151&catalogId=11051"
  );
});
