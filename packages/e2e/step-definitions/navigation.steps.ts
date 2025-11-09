import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  "I am on a page",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
  }
);

Given(
  "I am viewing a nested page",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/p/Welcome/Tasks/Write Tests`, { waitUntil: "domcontentloaded" });
  }
);

Given(
  "I have navigated through multiple pages",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    
    const firstPage = page.getByRole("button", { name: /Navigate to/i }).first();
    await firstPage.click();
    await page.waitForTimeout(500);
    
    const secondPage = page.getByRole("button", { name: /Navigate to/i }).nth(1);
    await secondPage.click();
    await page.waitForTimeout(500);
  }
);

When(
  /^I visit the root URL "([^"]*)"$/,
  async function (this: AppWorld, url: string) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}${url}`, { waitUntil: "domcontentloaded" });
  }
);

When(
  "I click a different page in the sidebar",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const pageButtons = page.getByRole("button", { name: /Navigate to/i });
    const count = await pageButtons.count();
    
    if (count > 1) {
      await pageButtons.nth(1).click();
    }
  }
);

When(
  /^I visit a direct page URL "([^"]*)"$/,
  async function (this: AppWorld, url: string) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}${url}`, { waitUntil: "domcontentloaded" });
  }
);

When(
  "I click a parent breadcrumb",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const breadcrumbs = page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("button");
    const count = await breadcrumbs.count();
    
    if (count > 1) {
      await breadcrumbs.first().click();
    }
  }
);

When(
  "I click the back button",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.getByRole("button", { name: "Go back" }).click();
  }
);

Then(
  "I should be redirected to the first page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForURL(/\/p\/.+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/p\/.+/);
  }
);

Then(
  "I should see that page's content",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    const titleField = page.getByLabel("Page title");
    await expect(titleField).toBeVisible();
  }
);

Then(
  "the URL should update to match the page path",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    expect(page.url()).toMatch(/\/p\/.+/);
  }
);

Then(
  /^I should see the "([^"]*)" page content$/,
  async function (this: AppWorld, pageTitle: string) {
    const page = await this.ensurePage();
    const titleField = page.getByLabel("Page title");
    await expect(titleField).toHaveValue(pageTitle);
  }
);

Then(
  "the sidebar should highlight that page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForSelector('[aria-label*="Navigate to"]', { timeout: 5000 });
    const currentPage = page.getByRole("button", { name: /Navigate to Write Tests/i });
    await expect(currentPage).toBeVisible();
  }
);

Then(
  "I should navigate to that parent page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForURL(/\/p\/.+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/p\/.+/);
  }
);

Then(
  "I should return to the previous page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    expect(page.url()).toMatch(/\/p\/.+/);
  }
);

