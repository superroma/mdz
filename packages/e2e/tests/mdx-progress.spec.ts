import { test, expect } from "@playwright/test";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

test("Progress component renders correctly in markdown", async ({ page }) => {
  // Navigate to Markdown Guide page
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
  
  // Click on Markdown Guide page
  const markdownGuideButton = page.getByRole("button", { name: /Navigate to Markdown Guide/i });
  await markdownGuideButton.click();
  
  await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
  await page.waitForSelector('.prose', { timeout: 5000 });

  // Wait for MDX to compile and render
  await page.waitForTimeout(1000);

  // Check that Progress component is rendered (has role="progressbar")
  const progressBar = page.locator('[role="progressbar"]').first();
  await expect(progressBar).toBeVisible({ timeout: 5000 });

  // Check that it has the correct value (75%)
  const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
  expect(ariaValueNow).toBe('75');

  // Check that label is displayed
  const label = page.getByText('Backend Development');
  await expect(label).toBeVisible();

  // Check that percentage is displayed
  const percentage = page.getByText('75%');
  await expect(percentage).toBeVisible();

  // Check that progress bar has green color (bg-green-500)
  const progressFill = page.locator('.bg-green-500').first();
  await expect(progressFill).toBeVisible();

  // Verify the progress bar has appropriate width (should be around 75%)
  const progressBarWidth = await progressFill.evaluate((el) => {
    const width = window.getComputedStyle(el).width;
    const parentWidth = window.getComputedStyle(el.parentElement!).width;
    return { width: parseFloat(width), parentWidth: parseFloat(parentWidth) };
  });
  
  const percentageWidth = (progressBarWidth.width / progressBarWidth.parentWidth) * 100;
  expect(percentageWidth).toBeGreaterThan(70);
  expect(percentageWidth).toBeLessThan(80);
});

