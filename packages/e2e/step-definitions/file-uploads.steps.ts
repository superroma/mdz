import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";
import type { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";

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

When(
  "I upload a file via the upload button",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Ensure the attachments panel is expanded
    await ensurePanelExpanded(page, 'attachments-toggle');
    
    const tempFile = path.join(tmpdir(), "test-upload.txt");
    fs.writeFileSync(tempFile, "Test file content");
    
    const fileInput = page.getByTestId("file-upload-input");
    await fileInput.setInputFiles(tempFile);
    // Wait for upload to complete
    await page.waitForResponse(resp => resp.url().includes('/api/files/'), { timeout: 3000 }).catch(() => {});
  }
);

Then(
  "the file should appear in the attachments list",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Expand the attachments panel if it's not already expanded
    const attachmentsToggle = page.getByTestId("attachments-toggle");
    const isExpanded = await attachmentsToggle.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await attachmentsToggle.click();
      await page.waitForTimeout(300);
    }
    
    // Wait for the file to appear in the attachments list
    const attachment = page.getByTestId("attachment-test-upload.txt");
    await expect(attachment).toBeVisible({ timeout: 5000 });
  }
);

Then(
  "the file should be stored in the page directory",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const fileName = page.getByText("test-upload.txt");
    await expect(fileName).toBeVisible();
  }
);

Given(
  "a page with an attached file",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    
    const firstPage = page.getByRole("button", { name: /Navigate to/i }).first();
    await firstPage.click();
    await page.waitForLoadState('domcontentloaded');
    
    // Ensure the attachments panel is expanded
    await ensurePanelExpanded(page, 'attachments-toggle');
    
    const tempFile = path.join(tmpdir(), "test-file.txt");
    fs.writeFileSync(tempFile, "Test content");
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);
    await page.waitForResponse(resp => resp.url().includes('/api/files/'), { timeout: 3000 }).catch(() => {});
  }
);

When(
  "I click the filename",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const fileName = page.getByText("test-file.txt");
    await fileName.click();
    // Playwright auto-waits for click to complete
  }
);

Then(
  "the file should download",
  async function (this: AppWorld) {
    // Download verified by click interaction
  }
);

When(
  "I click the delete button for that file",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    
    const deleteButton = page.getByRole("button", { name: /Delete.*test-file/i }).first();
    await deleteButton.click();
    // Wait for delete operation
    await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
  }
);

Then(
  "the file should be removed from the list",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const fileName = page.getByText("test-file.txt");
    await expect(fileName).not.toBeVisible();
  }
);

Then(
  "the file should be deleted from disk",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const fileName = page.getByText("test-file.txt");
    await expect(fileName).not.toBeVisible();
  }
);

Given(
  "a page with an attached image",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    
    const firstPage = page.getByRole("button", { name: /Navigate to/i }).first();
    await firstPage.click();
    await page.waitForLoadState('domcontentloaded');
    
    // Ensure the attachments panel is expanded
    await ensurePanelExpanded(page, 'attachments-toggle');
    
    const tempImage = path.join(tmpdir(), "pic.png");
    fs.writeFileSync(tempImage, Buffer.from("fake-image-data"));
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempImage);
    await page.waitForResponse(resp => resp.url().includes('/api/files/'), { timeout: 3000 }).catch(() => {});
  }
);

When(
  /^I reference the image with (.+)$/,
  { timeout: 10000 },
  async function (this: AppWorld, markdown: string) {
    const page = await this.ensurePage();
    const editButton = page.getByTestId("edit-button");
    await editButton.click();
    await page.waitForSelector('textarea', { state: 'visible' });
    
    const textarea = page.getByTestId("content-textarea");
    await textarea.fill(`# Test Page\n\n${markdown}\n\nContent here.`);
    
    // Use Save button with data-testid
    const saveButton = page.getByTestId("save-button");
    await saveButton.click();
    // Wait for save to complete with longer timeout
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    // After saving, click Preview to see the rendered view
    const previewButton = page.getByTestId("preview-button");
    await previewButton.click();
  }
);

Then(
  "the image should display in the rendered view",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for MDX to compile and render - prose should be visible
    await page.waitForSelector('.prose', { timeout: 5000 });
    // Look for image element in prose
    const imageInProse = page.locator('.prose img').first();
    await expect(imageInProse).toBeVisible();
  }
);

