import { test, expect } from "@playwright/test";

test("projects - add & remove", async ({ page }) => {
  test.slow();

  // login flow
  await page.goto("https://www.sherwin-williams.com/");
  await page.getByRole("button", { name: "Reject All Non-Essential Cookies" }).click();
  await page.getByRole("link", { name: "Sign in Link" }).click();
  await page.getByLabel("Email*").fill("jonathan+sherwin@checklyhq.com");
  await page.getByLabel("Password*").fill("abracadabra1!");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(
    "https://www.sherwin-williams.com/AjaxLogonForm?storeId=10151&catalogId=11051"
  );

  await page.getByRole("button", { name: "Project Center" }).click();
  await page.getByRole("link", { name: "View All Staining How Tos " }).click();
  await page.getByRole("link", { name: "A car parked in a garage with tan flooring." }).click();
  await page.getByText("H&C® Shield-Crete® Water-Based Epoxy Garage Floor Coating").first().click();
  // await page.locator("#text-5b02b3a2a0 > ol > li:nth-child(3) > a > b > u").click();
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("link", { name: "Go to Project List" }).click();
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Delete" }).click({ force: true });
  await page.locator("a").filter({ hasText: "Yes, Delete It" }).click();

  await page.waitForTimeout(3000);

  // const noSavedItems = await page.getByRole("heading", {
  //   name: "You have no saved items in your project list.",
  // });

  await expect(page.getByText("You have no saved items in your project list.")).toBeVisible();
});

// const noSavedItems = await page.locator("h3");

// await expect(noSavedItems).toContain("You have no saved items in your project list.");
