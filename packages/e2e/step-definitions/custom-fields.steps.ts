import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";
import type { Page } from "@playwright/test";

// Helper to ensure a collapsible panel is expanded
async function ensurePanelExpanded(page: Page, panelTestId: string) {
  const toggleButton = page.getByTestId(panelTestId);
  await expect(toggleButton).toBeVisible({ timeout: 5000 });
  
  const isExpanded = await toggleButton.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await toggleButton.click();
    await page.waitForTimeout(300);
  }
}

Given(
  "a page with custom fields",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/Welcome/Tasks/Write%20Tests`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
  }
);

Given(
  "I create a parent page with a schema",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    
    const createButton = page.getByRole("button", { name: "Create new page" });
    await createButton.click();
    await page.waitForTimeout(500);
    
    const titleField = page.getByLabel("Page title");
    await titleField.fill("Test Parent");
    await titleField.press("Enter");
    await page.waitForTimeout(500);
    
    const editButton = page.getByRole("button", { name: "Edit" });
    await editButton.click();
    await page.waitForTimeout(300);
    
    const textarea = page.locator("textarea");
    await textarea.fill(`---
__schema:
  - name: status
    type: select
    options: [Todo, Done]
  - name: priority
    type: select
    options: [Low, High]
---

# Test Parent

Content here.
`);
    
    const saveButton = page.getByTestId("save-button");
    await saveButton.click();
    
    await page.waitForSelector('button:has-text("Save"):not([disabled])', { timeout: 5000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    await page.goto(FRONTEND_URL, { waitUntil: "load" });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    // Ensure the parent page appears in sidebar before proceeding
    await page.waitForSelector('button[aria-label*="Test Parent"]', { timeout: 10000 });
    await page.waitForTimeout(500);
  }
);

When(
  "I create a child page",
  { timeout: 30000 },
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    await page.waitForSelector('button[aria-label*="Test Parent"]', { timeout: 10000 });
    
    const groups = page.locator(".group");
    const groupCount = await groups.count();
    
    let targetGroup;
    for (let i = 0; i < groupCount; i++) {
      const group = groups.nth(i);
      const text = await group.textContent();
      if (text && text.includes("Test Parent")) {
        targetGroup = group;
        break;
      }
    }
    
    if (!targetGroup) {
      throw new Error("Could not find Test Parent group in sidebar");
    }
    
    await targetGroup.hover();
    await page.waitForTimeout(300);
    const addButton = targetGroup.getByRole("button", { name: /Add child page/i });
    await addButton.click();
    
    await page.waitForURL(/\/Test.*Parent\/Untitled/, { timeout: 10000 });
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 10000 });
    
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }
);

When(
  "I edit a field value in the collapsible panel",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Ensure the custom fields panel is expanded
    await ensurePanelExpanded(page, 'custom-fields-toggle');
    
    const statusSelect = page.locator("select").first();
    await statusSelect.selectOption("Done");
    await page.waitForTimeout(500);
  }
);

When(
  "I edit the field",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Ensure the custom fields panel is expanded
    await ensurePanelExpanded(page, 'custom-fields-toggle');
    
    const selectField = page.locator("select").first();
    await selectField.click();
    await page.waitForTimeout(300);
  }
);

Then(
  "the child should have fields matching the schema",
  { timeout: 30000 },
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    const customFieldsPanel = page.getByTestId('custom-fields-panel');
    await expect(customFieldsPanel).toBeVisible({ timeout: 10000 });
    
    await ensurePanelExpanded(page, 'custom-fields-toggle');
    
    const statusField = page.getByTestId('field-status');
    await expect(statusField).toBeVisible();
  }
);

Then(
  "the value should auto-save",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(1000);
    const statusSelect = page.locator("select").first();
    const value = await statusSelect.inputValue();
    expect(value).toBe("Done");
  }
);

Then(
  "the front-matter should be updated",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const editButton = page.getByRole("button", { name: "Edit" });
    await editButton.click();
    await page.waitForTimeout(300);
    
    const textarea = page.locator("textarea");
    const content = await textarea.inputValue();
    expect(content).toContain("status: Done");
  }
);

Then(
  "I should only see the defined options",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const selectField = page.locator("select").first();
    const options = await selectField.locator("option").allTextContents();
    expect(options).toContain("Todo");
    expect(options).toContain("Done");
  }
);

Given(
  "a page with a select field",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(`${FRONTEND_URL}/Welcome/Tasks/Write%20Tests`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="Page title"]', { timeout: 5000 });
  }
);

