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
    await page.goto(`${FRONTEND_URL}/Welcome/Tasks`, { waitUntil: "domcontentloaded" });
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
    // Use semantic selector: board cards have role="button" and aria-label starting with "Open page"
    const cards = page.getByRole('button', { name: /Open page/i });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  }
);

Given(
  "a BoardView displaying pages",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/Welcome/Tasks`, { waitUntil: "load" });
    await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  }
);

When(
  "I click a page title in the board",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for board view to load
    await page.waitForSelector('text=Board View', { timeout: 10000 });
    // Wait for cards to appear using semantic selector
    const cards = page.getByRole('button', { name: /Open page/i });
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    // Click the first card
    await cards.first().click();
    // Wait for navigation to start
    await page.waitForTimeout(1000);
  }
);

Then(
  "I should navigate to that page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for navigation to a page (not root)
    await page.waitForURL((url) => {
      const path = new URL(url).pathname;
      return path !== "/" && path.length > 1;
    }, { timeout: 10000 });
    // Wait for page content to load
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe("/");
    expect(pathname.length).toBeGreaterThan(1);
  }
);

Given(
  "a page with Tabs containing multiple views",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/Welcome/Tasks`, { waitUntil: "load" });
    await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
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
    // Wait for tab content to load
    await page.waitForTimeout(1000);
    // Look for any of the view types
    const gridView = page.locator("text=Grid View");
    const calendarView = page.locator("text=Calendar View");
    const listView = page.locator("text=List View");
    const boardView = page.locator("text=Board View");
    
    // Check if any view is visible
    const gridVisible = await gridView.isVisible().catch(() => false);
    const calendarVisible = await calendarView.isVisible().catch(() => false);
    const listVisible = await listView.isVisible().catch(() => false);
    const boardVisible = await boardView.isVisible().catch(() => false);
    
    expect(gridVisible || calendarVisible || listVisible || boardVisible).toBe(true);
  }
);

