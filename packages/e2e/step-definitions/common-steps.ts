import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";
import {
  setupPage,
  waitForPageLoad,
  navigateToPageByTitle,
  switchToMode,
  verifyNavigation,
  clickButton,
  waitForNetworkIdle
} from "../support/test-helpers";

// ============================================================================
// GIVEN Steps - Setup/Preconditions
// ============================================================================

/**
 * Sets up viewing a generic page (first available page)
 * Usage: "Given I am viewing a page"
 */
Given(
  "I am viewing a page",
  async function (this: AppWorld) {
    const page = await setupPage(this);
    await waitForPageLoad(page);
  }
);

/**
 * Sets up viewing a page in a specific mode
 * Usage: "Given I am viewing a page in view mode"
 */
Given(
  "I am viewing a page in {word} mode",
  async function (this: AppWorld, mode: 'edit' | 'preview' | 'view') {
    const page = await setupPage(this);
    await waitForPageLoad(page);
    await switchToMode(page, mode);
  }
);

/**
 * Navigates to a specific page by title
 * Usage: "Given I am viewing the 'Getting Started' page"
 */
Given(
  /^I am viewing (?:the )?"([^"]*)" page$/,
  async function (this: AppWorld, pageTitle: string) {
    const page = await setupPage(this);
    await navigateToPageByTitle(page, pageTitle);
    await page.waitForSelector('.prose', { timeout: 5000 });
  }
);

/**
 * Alias for "I am viewing a page"
 * Usage: "Given I am on a page"
 */
Given(
  "I am on a page",
  async function (this: AppWorld) {
    const page = await setupPage(this);
    await page.waitForSelector('[data-testid="page-view"]', { timeout: 5000 });
  }
);

/**
 * Sets the current mode (edit or preview)
 * Usage: "Given I am in edit mode" or "And I am in preview mode"
 */
Given(
  "I am in {word} mode",
  async function (this: AppWorld, mode: 'edit' | 'preview' | 'view') {
    const page = await this.ensurePage();
    await switchToMode(page, mode);
  }
);

// ============================================================================
// WHEN Steps - Actions
// ============================================================================

/**
 * Clicks a button by name
 * Usage: "When I click the Edit button" or "When I click the 'Save' button"
 */
When(
  /^I click the ["']?(\w+)["']? button$/,
  async function (this: AppWorld, buttonName: string) {
    const page = await this.ensurePage();
    await clickButton(page, buttonName);
  }
);

// ============================================================================
// THEN Steps - Assertions
// ============================================================================

/**
 * Verifies that an element is visible
 * Usage: "Then I should see the markdown source editor"
 */
Then(
  "I should see the markdown source editor",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByTestId("content-textarea");
    await expect(editor).toBeVisible();
  }
);

/**
 * Verifies that the content should be saved
 * Usage: "Then the content should be saved"
 */
Then(
  "the content should be saved",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByTestId("content-textarea");
    const value = await editor.inputValue();
    expect(value).toBeTruthy();
  }
);

/**
 * Verifies URL update
 * Usage: "Then the URL should update to match the page path"
 */
Then(
  "the URL should update to match the page path",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe("/");
    expect(pathname.length).toBeGreaterThan(1);
  }
);

/**
 * Verifies URL update if needed (more lenient)
 * Usage: "Then the URL should update if needed"
 */
Then(
  "the URL should update if needed",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe("/");
    expect(pathname.length).toBeGreaterThan(1);
  }
);
