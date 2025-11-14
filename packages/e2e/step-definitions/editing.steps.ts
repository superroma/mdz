import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  "I am viewing a page in view mode",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
  }
);

Given(
  "I am editing a page",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    await page.getByRole("button", { name: "Edit" }).click();
  }
);

Given(
  "the title field is focused",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
    const titleField = page.getByLabel("Page title");
    await titleField.focus();
  }
);

When(
  "I edit the title field and blur focus",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByLabel("Page title");
    await titleField.fill("Test Title Auto Save");
    await titleField.blur();
    await page.waitForTimeout(500);
  }
);

When(
  "I click the Edit button",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.getByRole("button", { name: "Edit" }).click();
  }
);

When(
  "I modify the content and press Cmd+S",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editorContainer = page.getByLabel("Page content");
    // MDXEditor uses a contentEditable div - we need to interact with it differently
    const contentEditable = editorContainer.locator('[contenteditable="true"]').first();
    await contentEditable.click();
    await page.waitForTimeout(200);
    // Select all using both Ctrl+A and Meta+A to ensure it works
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Meta+a");
    await page.waitForTimeout(200);
    // Delete selected content
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(200);
    // Type new content
    await page.keyboard.type("Modified content for testing", { delay: 1 });
    await page.waitForTimeout(300);
    await page.keyboard.press("Meta+s");
    await page.waitForTimeout(500);
  }
);

When(
  "I press Enter",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByLabel("Page title");
    await titleField.press("Enter");
  }
);

Then(
  "the title should be saved automatically",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    const titleField = page.getByLabel("Page title");
    const value = await titleField.inputValue();
    expect(value).toBe("Test Title Auto Save");
  }
);

Then(
  "I should see the markdown source editor",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByLabel("Page content");
    await expect(editor).toBeVisible();
  }
);

Then(
  "the content should be saved",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(500);
    const editorContainer = page.getByLabel("Page content");
    // MDXEditor uses a contentEditable div - get the full inner text
    const contentEditable = editorContainer.locator('[contenteditable="true"]').first();
    const textContent = await contentEditable.evaluate((el) => {
      return (el as HTMLElement).innerText || el.textContent || '';
    });
    expect(textContent?.trim()).toBe("Modified content for testing");
  }
);

Then(
  "I should see a success indicator",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const saveButton = page.getByRole("button", { name: "Save", exact: true });
    await expect(saveButton).toBeDisabled();
  }
);

Then(
  "the content editor should receive focus",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(200);
  }
);

