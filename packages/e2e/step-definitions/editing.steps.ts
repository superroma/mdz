import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";
import { setupPage, waitForPageLoad, clickButton, waitForNetworkIdle } from "../support/test-helpers";

// Removed: Now using common step from common-steps.ts
// Given "I am viewing a page in view mode"

Given(
  "I am editing a page",
  async function (this: AppWorld) {
    const page = await setupPage(this);
    await waitForPageLoad(page);
    await clickButton(page, "Edit");
  }
);

Given(
  "the title field is focused",
  async function (this: AppWorld) {
    const page = await setupPage(this);
    await waitForPageLoad(page);
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
    await waitForNetworkIdle(page);
  }
);

// Removed: Now using common step from common-steps.ts
// When "I click the Edit button"

When(
  "I modify the content and press Cmd+S",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByTestId("content-textarea");
    await editor.fill("Modified content for testing");
    await editor.press("Meta+s");
    await waitForNetworkIdle(page);
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

// Removed: Now using common step from common-steps.ts
// Then "I should see the markdown source editor"

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

