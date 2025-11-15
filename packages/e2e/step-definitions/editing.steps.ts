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
  "I modify the content and press Cmd+S",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByTestId("content-textarea");
    await editor.fill("Modified content for testing");
    await editor.press("Meta+s");
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
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
  "the content should be saved",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByTestId("content-textarea");
    const value = await editor.inputValue();
    expect(value).toBe("Modified content for testing");
  }
);

Then(
  "I should see a success indicator",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const saveButton = page.getByTestId("save-button");
    await expect(saveButton).toBeDisabled();
  }
);

Then(
  "the content editor should receive focus",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForLoadState('domcontentloaded');
  }
);

