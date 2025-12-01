import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";
import {
  setupPage,
  waitForPageLoad,
  navigateToPageByTitle,
  switchToMode,
  verifyNavigation,
  fillTitleAndSubmit
} from "../support/test-helpers";

// ============================================================================
// GIVEN Steps - Setup/Preconditions
// ============================================================================

Given(
  "I am viewing a page",
  async function (this: AppWorld) {
    const page = await setupPage(this);
    await waitForPageLoad(page);
  }
);

Given(
  /^I am viewing (?:the )?"([^"]*)" page$/,
  async function (this: AppWorld, pageTitle: string) {
    const page = await setupPage(this);
    try {
      await navigateToPageByTitle(page, pageTitle);
    } catch (error) {
      console.error("[common-steps] failed to navigate to", pageTitle, error);
      throw error;
    }
    await page.waitForSelector('.prose', { timeout: 5000 });
  }
);

Given(
  "I navigate to {string}",
  async function (this: AppWorld, path: string) {
    const page = await setupPage(this);
    const { FRONTEND_URL } = await import("../support/constants");
    await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: "domcontentloaded" });
    await waitForPageLoad(page);
  }
);

Given(
  "I am in {word} mode",
  async function (this: AppWorld, mode: 'edit' | 'preview') {
    const page = await this.ensurePage();
    await switchToMode(page, mode);
  }
);

// ============================================================================
// WHEN Steps - Actions
// ============================================================================

When(
  "I edit the title field and {word}",
  async function (this: AppWorld, action: string) {
    const page = await this.ensurePage();
    const submitKey = action.includes('Enter') ? 'Enter' : 'blur';
    await fillTitleAndSubmit(page, "Test Title", submitKey);
  }
);

When(
  "I click the {string} button",
  async function (this: AppWorld, buttonName: string) {
    const page = await this.ensurePage();
    const buttonMap: Record<string, string> = {
      'Edit': 'Edit page content',
      'Save': 'Save page content',
      'Preview': 'Preview page content',
      'Delete': 'Delete page',
      'Back': 'Go back'
    };
    
    const ariaLabel = buttonMap[buttonName];
    if (ariaLabel) {
      await page.getByRole('button', { name: ariaLabel }).click();
    } else {
      await page.getByRole('button', { name: buttonName }).click();
    }
  }
);

// ============================================================================
// THEN Steps - Assertions
// ============================================================================

Then(
  "I should be navigated to {word} page",
  async function (this: AppWorld, pageType: string) {
    const page = await this.ensurePage();
    
    const patterns: Record<string, RegExp> = {
      'new': /Untitled/,
      'another': /.+/,
      'child': /\/.+\/.+/,
      'parent': /.+/
    };
    
    const pattern = patterns[pageType] || /.+/;
    await verifyNavigation(page, pattern);
  }
);

Then(
  "the {string} should be visible",
  async function (this: AppWorld, element: string) {
    const page = await this.ensurePage();
    
    if (element === 'markdown source editor') {
      const editor = page.getByRole("textbox", { name: "Page content" });
      await editor.waitFor({ timeout: 5000 });
      await expect(editor).toBeVisible();
    } else if (element === 'page title') {
      const titleField = page.getByRole("textbox", { name: "Page title" });
      await titleField.waitFor({ timeout: 5000 });
      await expect(titleField).toBeVisible();
    } else if (element === 'sidebar') {
      const sidebar = page.getByRole("complementary", { name: "Page navigation sidebar" });
      await sidebar.waitFor({ timeout: 5000 });
      await expect(sidebar).toBeVisible();
    } else if (element === 'prose content') {
      await page.waitForSelector('.prose', { timeout: 5000 });
      await expect(page.locator('.prose')).toBeVisible();
    } else {
      await page.waitForSelector(element, { timeout: 5000 });
      await expect(page.locator(element)).toBeVisible();
    }
  }
);

Then(
  "the URL should {word} {string}",
  async function (this: AppWorld, verb: string, pattern: string) {
    const page = await this.ensurePage();
    const pathname = new URL(page.url()).pathname;
    
    switch (verb) {
      case 'contain':
      case 'include':
        expect(pathname).toContain(pattern);
        break;
      case 'match':
        expect(pathname).toMatch(new RegExp(pattern));
        break;
      case 'be':
        expect(pathname).toBe(pattern);
        break;
      default:
        expect(pathname).toMatch(new RegExp(pattern));
    }
  }
);

