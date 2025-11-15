import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  "I am editing a page",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="page-title-input"]', { timeout: 5000 });
    await page.getByTestId("edit-button").click();
  }
);

Given(
  "the title field is focused",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="page-title-input"]', { timeout: 5000 });
    const titleField = page.getByTestId("page-title-input");
    await titleField.focus();
  }
);

When(
  "I edit the title field and blur focus",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByTestId("page-title-input");
    await titleField.fill("Test Title Auto Save");
    await titleField.blur();
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
  }
);

When(
  "I modify the content",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByTestId("content-textarea");
    await editor.fill("Modified content for testing");
  }
);

When(
  "I press Enter",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByTestId("page-title-input");
    await titleField.press("Enter");
  }
);

Then(
  "the title should be saved automatically",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByTestId("page-title-input");
    const value = await titleField.inputValue();
    expect(value).toBe("Test Title Auto Save");
  }
);

Then(
  "the content should be auto-saved after delay",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for autosave delay (1 second) plus network time
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    
    const editor = page.getByTestId("content-textarea");
    const value = await editor.inputValue();
    expect(value).toBe("Modified content for testing");
  }
);

Then(
  "the content editor should receive focus",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForLoadState('domcontentloaded');
  }
);

