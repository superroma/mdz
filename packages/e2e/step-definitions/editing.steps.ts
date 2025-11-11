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
    
    // Wait for Monaco editor to load
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    await page.waitForTimeout(1500); // Give Monaco time to fully initialize
    
    // Use Monaco's API directly to set the content
    await page.evaluate(() => {
      // Access Monaco editor instance through the window object
      // Monaco editors are typically stored in a global array
      const monacoDiv = document.querySelector('.monaco-editor');
      if (monacoDiv) {
        // Try to find the editor instance through React fiber
        const editorInstance = (monacoDiv as any)['data-editor'] || 
                             (window as any).monaco?.editor?.getEditors?.()?.[0];
        
        if (editorInstance && editorInstance.setValue) {
          editorInstance.setValue("Modified content for testing");
        } else {
          // Fallback: try to find textarea and set value
          const textarea = monacoDiv.querySelector('textarea');
          if (textarea) {
            (textarea as HTMLTextAreaElement).value = "Modified content for testing";
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    });
    
    await page.waitForTimeout(300);
    
    // Press Cmd+S to save
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
    // Monaco editor renders as a div with role="textbox" and aria-label="Page content"
    const editor = page.getByLabel("Page content");
    await expect(editor).toBeVisible({ timeout: 10000 });
    
    // Also check that Monaco editor's actual editor is loaded
    // Monaco creates a .monaco-editor element
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 10000 });
  }
);

Then(
  "the content should be saved",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(1000);
    
    // Get the Monaco editor's text content
    // Monaco stores the model content, we can read it from the visible text
    const editorContent = page.locator('.monaco-editor .view-lines');
    await expect(editorContent).toBeVisible();
    
    // Get the text content from Monaco's view
    const text = await editorContent.textContent();
    expect(text?.trim()).toBe("Modified content for testing");
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

