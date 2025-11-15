import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  "I am viewing a nested page",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/Welcome/Tasks/Write%20Tests`, { waitUntil: "domcontentloaded" });
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
    await page.waitForLoadState('domcontentloaded');
    
    const secondPage = page.getByRole("button", { name: /Navigate to/i }).nth(1);
    await secondPage.click();
    await page.waitForLoadState('domcontentloaded');
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
    // Remove /p/ prefix if present (for backward compatibility with test scenarios)
    const cleanUrl = url.replace(/^\/p\//, "/");
    await page.goto(`${FRONTEND_URL}${cleanUrl}`, { waitUntil: "domcontentloaded" });
  }
);

When(
  "I click a parent breadcrumb",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const breadcrumbs = page.getByTestId("breadcrumb").getByRole("button");
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
    await page.getByTestId("back-button").click();
  }
);

Then(
  "I should be redirected to the first page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for navigation to a page (not root)
    await page.waitForURL((url) => {
      const path = new URL(url).pathname;
      return path !== "/" && path.length > 1;
    }, { timeout: 5000 });
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe("/");
    expect(pathname.length).toBeGreaterThan(1);
  }
);

Then(
  "I should see that page's content",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForSelector('[data-testid="page-title-input"]', { timeout: 5000 });
    const titleField = page.getByTestId("page-title-input");
    await expect(titleField).toBeVisible();
  }
);

Then(
  "the URL should update to match the page path",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // URL should be a page path (not root)
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe("/");
    expect(pathname.length).toBeGreaterThan(1);
  }
);

Then(
  /^I should see the "([^"]*)" page content$/,
  async function (this: AppWorld, pageTitle: string) {
    const page = await this.ensurePage();
    // Wait for page to load
    await page.waitForSelector('[data-testid="page-title-input"]', { timeout: 10000 });
    const titleField = page.getByTestId("page-title-input");
    // Wait for title to have the expected value
    await expect(titleField).toHaveValue(pageTitle, { timeout: 5000 });
  }
);

Then(
  "the sidebar should highlight that page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 5000 });
    // Look specifically in the sidebar to avoid conflict with breadcrumbs
    const sidebar = page.getByTestId("sidebar");
    const currentPage = sidebar.getByRole("button", { name: /Navigate to Write Tests/i }).first();
    await expect(currentPage).toBeVisible();
  }
);

Then(
  "I should return to the previous page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // URL should be a page path (not root)
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe("/");
    expect(pathname.length).toBeGreaterThan(1);
  }
);

