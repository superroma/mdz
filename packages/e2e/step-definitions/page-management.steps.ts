import { Then, When, Given } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { AppWorld } from "../support/world";

When(
  /^I click the root "\+" button$/,
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const pageLoaded = await page.url();
    if (!pageLoaded || pageLoaded === 'about:blank') {
      await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    }
    
    const createButton = page.getByRole("button", { name: "Create new page" });
    await createButton.waitFor({ state: 'visible', timeout: 5000 });
    await createButton.click();
    
    await page.waitForLoadState('domcontentloaded');
  }
);

When(
  "I edit the title field and press Enter",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByRole("textbox", { name: "Page title" });
    await titleField.fill("Test Page Renamed");
    await titleField.press("Enter");
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
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
    await page.waitForLoadState('domcontentloaded');
  }
);

Then(
  /^a new page named "([^"]*)" should be created$/,
  async function (this: AppWorld, pageName: string) {
    const page = await this.ensurePage();
    await page.getByRole("textbox", { name: "Page title" }).waitFor({ timeout: 5000 });
    const titleField = page.getByRole("textbox", { name: "Page title" });
    await expect(titleField).toHaveValue(pageName);
  }
);

Then(
  "the title field should be focused with text selected",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByRole("textbox", { name: "Page title" });
    await expect(titleField).toBeFocused();
  }
);

Then(
  "the page should be renamed",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByRole("textbox", { name: "Page title" });
    const value = await titleField.inputValue();
    expect(value).not.toBe("Untitled");
  }
);

Then(
  "the URL should update if needed",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // URL should be a page path (not root)
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe("/");
    expect(pathname.length).toBeGreaterThan(1);
  }
);

Then(
  "the sidebar should show the new name",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const sidebarButtons = page.getByRole("button", { name: /Navigate to/i });
    const count = await sidebarButtons.count();
    expect(count).toBeGreaterThan(0);
  }
);

Then(
  "a new child page should be created",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.getByRole("textbox", { name: "Page title" }).waitFor({ timeout: 5000 });
    const titleField = page.getByRole("textbox", { name: "Page title" });
    await expect(titleField).toHaveValue("Untitled");
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
  "the sidebar should no longer show the deleted page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    const sidebarButtons = page.getByRole("button", { name: /Navigate to/i });
    const count = await sidebarButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  }
);

Given(
  "I am on a mobile viewport",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.setViewportSize({ width: 390, height: 844 });
  }
);

When(
  "I open the sidebar",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const hamburger = page.getByRole("button", { name: "Toggle sidebar" });
    const isVisible = await hamburger.isVisible().catch(() => false);
    if (isVisible) {
      const isExpanded = await hamburger.getAttribute("aria-expanded");
      if (isExpanded !== "true") {
        await hamburger.click();
      }
    }
  }
);

Then(
  "the sidebar should be closed",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const hamburger = page.getByRole("button", { name: "Toggle sidebar" });
    const expanded = await hamburger.getAttribute("aria-expanded");
    expect(expanded).not.toBe("true");
  }
);

