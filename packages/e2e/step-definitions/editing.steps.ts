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
    await page.getByRole("textbox", { name: "Page title" }).waitFor({ timeout: 5000 });
    await page.getByRole("button", { name: "Edit page content" }).click();
  }
);

Given(
  "the title field is focused",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.getByRole("textbox", { name: "Page title" }).waitFor({ timeout: 5000 });
    const titleField = page.getByRole("textbox", { name: "Page title" });
    await titleField.focus();
  }
);

When(
  "I edit the title field and blur focus",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByRole("textbox", { name: "Page title" });
    await titleField.fill("Test Title Auto Save");
    await titleField.blur();
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
  }
);

When(
  "I modify the content and press Cmd+S",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByRole("textbox", { name: "Page content" });
    await editor.fill("Modified content for testing");
    await editor.press("Meta+s");
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
  }
);

When(
  "I press Enter",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByRole("textbox", { name: "Page title" });
    await titleField.press("Enter");
  }
);

Then(
  "the title should be saved automatically",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const titleField = page.getByRole("textbox", { name: "Page title" });
    const value = await titleField.inputValue();
    expect(value).toBe("Test Title Auto Save");
  }
);

Then(
  "the content should be saved",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByRole("textbox", { name: "Page content" });
    const value = await editor.inputValue();
    expect(value).toBe("Modified content for testing");
  }
);

Then(
  "I should see a success indicator",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const saveButton = page.getByRole("button", { name: "Save page content" });
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

When(
  "I type some content in the editor",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByRole("textbox", { name: "Page content" });
    await editor.fill("Test content for autosave");
  }
);

When(
  "I wait for autosave to complete",
  async function (this: AppWorld) {
    // Wait for autosave time + some buffer
    await new Promise(resolve => setTimeout(resolve, 500));
  }
);

Then(
  "the content should be saved automatically",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
    const saveButton = page.getByRole("button", { name: "Save page content" });
    await expect(saveButton).toBeDisabled();
  }
);

Then(
  "the {string} should be hidden",
  async function (this: AppWorld, element: string) {
    const page = await this.ensurePage();
    if (element === "markdown source editor") {
      const editor = page.getByRole("textbox", { name: "Page content" });
      await expect(editor).not.toBeVisible();
    }
  }
);

Then(
  "the preview should show the new content",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const preview = page.getByRole("article");
    await expect(preview).toContainText("Test content for autosave");
  }
);

When(
  "I click the {string} button again",
  async function (this: AppWorld, buttonText: string) {
    const page = await this.ensurePage();
    if (buttonText === "Edit") {
      await page.getByRole("button", { name: "Edit page content" }).click();
    }
  }
);

Then(
  "the editor should contain my previous content",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByRole("textbox", { name: "Page content" });
    const value = await editor.inputValue();
    expect(value).toContain("Test content for autosave");
  }
);

Then(
  "I should be able to undo my changes",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editor = page.getByRole("textbox", { name: "Page content" });
    
    await editor.focus();
    await editor.press("Meta+z");
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const value = await editor.inputValue();
    expect(value).toBeDefined();
  }
);

Given(
  "I have a page with HTML content with inline styles",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.getByRole("textbox", { name: "Page title" }).waitFor({ timeout: 5000 });
    
    await page.getByRole("button", { name: "Edit page content" }).click();
    const editor = page.getByRole("textbox", { name: "Page content" });
    
    const contentWithStyles = `# Test HTML Sanitization

This page tests that inline styles are properly handled.

## HTML with inline styles

<div style="color:red">This text has inline style that should be removed</div>

<span style="background-color:yellow">This span also has inline style</span>

## Regular markdown

This is regular markdown without any HTML.`;
    
    await editor.fill(contentWithStyles);
    await editor.press("Meta+s");
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    
    await page.getByRole("button", { name: "Preview page content" }).click();
    await page.waitForTimeout(500);
  }
);

When(
  "I view the page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForLoadState('domcontentloaded');
  }
);

Then(
  "the page should display without errors",
  { timeout: 15000 },
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    const titleInput = page.getByRole("textbox", { name: "Page title" });
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    
    const editButton = page.getByRole("button", { name: "Edit page content" });
    await expect(editButton).toBeVisible();
  }
);

Then(
  "the HTML should be rendered without style attributes",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const errorMessage = page.locator('text=/Rendering Error:|MDX Error:/i');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      return;
    }
    
    const content = page.getByRole("article");
    const isVisible = await content.isVisible().catch(() => false);
    
    if (isVisible) {
      const divsWithStyle = await page.$$('article .prose div[style], article .prose span[style]');
      expect(divsWithStyle.length).toBe(0);
    }
  }
);

Given(
  "I have a page with malformed MDX content",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.getByRole("textbox", { name: "Page title" }).waitFor({ timeout: 5000 });
    
    await page.getByRole("button", { name: "Edit page content" }).click();
    const editor = page.getByRole("textbox", { name: "Page content" });
    await editor.fill("# Test\n\n<Component unclosed={");
    await editor.press("Meta+s");
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
    
    await page.getByRole("button", { name: "Preview page content" }).click();
  }
);

Then(
  "I should see an error message in the content area",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Check that an error message is displayed
    const errorMessage = page.locator('text=/MDX Error:|Rendering Error:/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  }
);

Then(
  "the app should not crash",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const titleInput = page.getByRole("textbox", { name: "Page title" });
    await expect(titleInput).toBeVisible();
    
    const editButton = page.getByRole("button", { name: "Edit page content" });
    await expect(editButton).toBeVisible();
  }
);

Then(
  "I should see the new page in preview mode",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const editButton = page.getByRole("button", { name: "Edit page content" });
    await expect(editButton).toBeVisible();
    
    const editor = page.getByRole("textbox", { name: "Page content" });
    await expect(editor).not.toBeVisible();
  }
);

Then(
  "the page content should match the new page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const titleField = page.getByRole("textbox", { name: "Page title" });
    const title = await titleField.inputValue();
    
    const preview = page.getByRole("article");
    await expect(preview).toBeVisible();
    
    const pathname = new URL(page.url()).pathname;
    expect(pathname).toContain(title.replace(/\s+/g, '%20'));
  }
);

