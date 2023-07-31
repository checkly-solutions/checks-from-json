test('Race against the clock', async ({ page }) => {
  await page.goto('https://next-danube-webshop.vercel.app/');

  const elementPromise = await page.waitForSelector('[data-test="The Sun Also Rises"]', { timeout: 250 });
  const timeoutPromise = await page.waitForTimeout(50)

  try {
    await Promise.all([timeoutPromise, elementPromise]);
  } catch (error) {
    throw new Error('Page load timed out');
  }

  // Continue with your test...
  await expect(page).toHaveTitle('Checkly Webshop');
});
