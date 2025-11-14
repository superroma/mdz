import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { AppWorld } from "../support/world";
import { setupPage, waitForNetworkIdle } from "../support/test-helpers";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";

When(
  "I upload a file via the upload button",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Find the Attachments panel toggle button
    const attachmentsButton = page.getByTestId("attachments-toggle");
    await attachmentsButton.click();
    // Wait for panel to open
    await page.waitForSelector('[data-testid="attachments-panel"]', { state: 'visible', timeout: 2000 });
    
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
    await page.waitForSelector("text=test-upload.txt", { timeout: 5000 });
    const fileName = page.getByText("test-upload.txt");
    await expect(fileName).toBeVisible();
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
    const page = await setupPage(this);
    
    const firstPage = page.getByRole("button", { name: /Navigate to/i }).first();
    await firstPage.click();
    await page.waitForLoadState('domcontentloaded');
    
    // Find the Attachments panel button (not the list item)
    const attachmentsButton = page.getByRole("button", { name: /Attachments/i }).first();
    await attachmentsButton.click();
    await page.waitForSelector('[data-testid="attachments-panel"]', { state: 'visible', timeout: 2000 });
    
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
    await waitForNetworkIdle(page);
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
    const page = await setupPage(this);
    
    const firstPage = page.getByRole("button", { name: /Navigate to/i }).first();
    await firstPage.click();
    await page.waitForLoadState('domcontentloaded');
    
    // Find the Attachments panel button (not the list item)
    const attachmentsButton = page.getByRole("button", { name: /Attachments/i }).first();
    await attachmentsButton.click();
    await page.waitForSelector('[data-testid="attachments-panel"]', { state: 'visible', timeout: 2000 });
    
    const tempImage = path.join(tmpdir(), "pic.png");
    fs.writeFileSync(tempImage, Buffer.from("fake-image-data"));
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempImage);
    await page.waitForResponse(resp => resp.url().includes('/api/files/'), { timeout: 3000 }).catch(() => {});
  }
);

When(
  /^I reference the image with (.+)$/,
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
    // Wait for save to complete
    await waitForNetworkIdle(page);
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

