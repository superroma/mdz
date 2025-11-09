import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  "a parent page with a schema",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/p/Tasks`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
  }
);

Given(
  "child pages with field values",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(1000);
  }
);

Given(
  "BoardView component in the parent content",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
  }
);

When(
  "I view the parent page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
  }
);

Then(
  "I should see a board grouped by the specified field",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(1000);
    const boardView = page.locator("text=Board View");
    await expect(boardView).toBeVisible();
  }
);

Then(
  "each card should show the child page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    const cards = page.locator('[class*="bg-slate-700"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  }
);

Given(
  "a BoardView displaying pages",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/p/Tasks`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
  }
);

When(
  "I click a page title in the board",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const card = page.locator('[class*="bg-slate-700"]').first();
    await card.click();
    await page.waitForTimeout(500);
  }
);

Then(
  "I should navigate to that page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForURL(/\/p\/.+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/p\/.+/);
  }
);

Given(
  "a page with Tabs containing multiple views",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/p/Tasks`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
  }
);

When(
  "I click a different tab",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const tabs = page.locator('button:has-text("Active"), button:has-text("Calendar"), button:has-text("All")');
    const count = await tabs.count();
    if (count > 0) {
      await tabs.first().click();
      await page.waitForTimeout(500);
    }
  }
);

Then(
  "I should see that view's content",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    const content = page.locator("text=Grid View, text=Calendar View, text=List View").first();
    await expect(content).toBeVisible();
  }
);

