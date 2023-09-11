import { test, expect } from "@playwright/test";

test("login", async ({ page }) => {
  test.setTimeout(45000);

  await page.goto('https://next-danube-webshop.vercel.app');

  await page.getByRole("link", { name: "login" }).click();
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="email"]').click();
  await page.locator('input[type="email"]').fill('jane@example.com');
  await page.locator('input[type="password"]').fill('password2');

  await page.getByRole("button", { name: "Login" }).click();

  const response = await page.waitForResponse((response) => {
    console.log(response.url(), "response url being hit");
    return response.url().includes(`/auth/login`);
  });
  const responseBody = await response.json();
  const success = responseBody.success;
  const token = responseBody.token;

  expect(success).toBe(true);
  expect(token).toBeDefined();
});
