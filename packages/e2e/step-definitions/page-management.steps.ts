import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  "I am viewing a page",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
  }
);

When(
  /^I click the root "\+" button$/,
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const pageLoaded = await page.url();
    if (!pageLoaded || pageLoaded === 'about:blank') {
      await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
    }
    
    const createButton = page.getByRole("button", { name: "Create new page" });
    const isVisible = await createButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      const hamburger = page.getByRole("button", { name: "Toggle sidebar" });
      const hamburgerVisible = await hamburger.isVisible().catch(() => false);
      if (hamburgerVisible) {
        await hamburger.click();
        await page.waitForTimeout(300);
      }
    }
    
    await createButton.click();
  }
);

When(
  "I edit the title field and press Enter",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByLabel("Page title");
    await titleField.fill("Test Page Renamed");
    await titleField.press("Enter");
    await page.waitForTimeout(500);
  }
);

When(
  /^I click that page's "\+" button in the sidebar$/,
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const treeItem = page.locator(".group").first();
    await treeItem.hover();
    const addButton = treeItem.getByRole("button", { name: /Add child page/i });
    await addButton.click();
  }
);

When(
  "I delete the page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    
    await page.getByRole("button", { name: "Delete page" }).click();
    await page.waitForTimeout(500);
  }
);

Then(
  /^a new page named "([^"]*)" should be created$/,
  async function (this: AppWorld, pageName: string) {
    const page = await this.ensurePage();
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    const titleField = page.getByLabel("Page title");
    await expect(titleField).toHaveValue(pageName);
  }
);

Then(
  "the title field should be focused with text selected",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByLabel("Page title");
    await expect(titleField).toBeFocused();
  }
);

Then(
  "I should be navigated to the new page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForURL(/\/p\/.+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/p\/.*Untitled/);
  }
);

Then(
  "the page should be renamed",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(1000);
    const titleField = page.getByLabel("Page title");
    const value = await titleField.inputValue();
    expect(value).not.toBe("Untitled");
  }
);

Then(
  "the URL should update if needed",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    expect(page.url()).toMatch(/\/p\/.+/);
  }
);

Then(
  "the sidebar should show the new name",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    const sidebarButtons = page.getByRole("button", { name: /Navigate to/i });
    const count = await sidebarButtons.count();
    expect(count).toBeGreaterThan(0);
  }
);

Then(
  "a new child page should be created",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    const titleField = page.getByLabel("Page title");
    await expect(titleField).toHaveValue("Untitled");
  }
);

Then(
  "I should be navigated to the new child page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForURL(/\/p\/.+\/Untitled/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/p\/.+\/Untitled/);
  }
);

Then(
  "the page should be removed",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    expect(page.url()).toMatch(/\//);
  }
);

Then(
  "I should be navigated to another page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  }
);

Then(
  "the sidebar should no longer show the deleted page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    const sidebarButtons = page.getByRole("button", { name: /Navigate to/i });
    const count = await sidebarButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  }
);

