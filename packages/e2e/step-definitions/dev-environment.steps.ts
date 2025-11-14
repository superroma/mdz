import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

When(
  /^I run "([^"]*)"$/,
  async function (this: AppWorld, command: string) {
    await ensureServersRunning();
  }
);

When(
  "I visit the application",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/Welcome`, { waitUntil: "load" });
    await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {});
  }
);

Then(
  "I should see the Welcome page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    const titleField = page.getByLabel("Page title");
    const value = await titleField.inputValue();
    expect(value.toLowerCase()).toContain("welcome");
  }
);

Then(
  "the sidebar should show all seed pages",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
    const sidebarButtons = page.getByRole("button", { name: /Navigate to/i });
    const count = await sidebarButtons.count();
    expect(count).toBeGreaterThan(0);
  }
);

Given(
  "the dev server is running",
  async function (this: AppWorld) {
    await ensureServersRunning();
  }
);

When(
  "I navigate to the Tasks page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    
    const tasksButton = page.getByRole("button", { name: /Navigate to.*Tasks/i });
    await tasksButton.click();
    await page.waitForTimeout(1000);
  }
);

Then(
  "I should see the BoardView component",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(1000);
    const boardView = page.locator("text=Board View");
    await expect(boardView).toBeVisible();
  }
);

Then(
  "I should see child task pages",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    // Use semantic selector: board cards have role="button" and aria-label starting with "Open page"
    const cards = page.getByRole('button', { name: /Open page/i });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  }
);

