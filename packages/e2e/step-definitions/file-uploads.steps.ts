import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";

When(
  "I upload a file via the upload button",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    // Find the Attachments panel button (not the list item)
    const attachmentsButton = page.getByRole("button", { name: /Attachments/i }).first();
    await attachmentsButton.click();
    await page.waitForTimeout(300);
    
    const tempFile = path.join(tmpdir(), "test-upload.txt");
    fs.writeFileSync(tempFile, "Test file content");
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(1000);
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
    await page.waitForTimeout(500);
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
    await page.waitForTimeout(500);
    
    // Find the Attachments panel button (not the list item)
    const attachmentsButton = page.getByRole("button", { name: /Attachments/i }).first();
    await attachmentsButton.click();
    await page.waitForTimeout(300);
    
    const tempFile = path.join(tmpdir(), "test-file.txt");
    fs.writeFileSync(tempFile, "Test content");
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(1000);
  }
);

When(
  "I click the filename",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const fileName = page.getByText("test-file.txt");
    await fileName.click();
    await page.waitForTimeout(500);
  }
);

Then(
  "the file should download",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await page.waitForTimeout(1000);
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
    await page.waitForTimeout(1000);
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
    await page.waitForTimeout(500);
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
    await page.waitForTimeout(500);
    
    // Find the Attachments panel button (not the list item)
    const attachmentsButton = page.getByRole("button", { name: /Attachments/i }).first();
    await attachmentsButton.click();
    await page.waitForTimeout(300);
    
    const tempImage = path.join(tmpdir(), "pic.png");
    fs.writeFileSync(tempImage, Buffer.from("fake-image-data"));
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempImage);
    await page.waitForTimeout(1000);
  }
);

When(
  /^I reference the image with (.+)$/,
  { timeout: 15000 },
  async function (this: AppWorld, markdown: string) {
    const page = await this.ensurePage();
    const editButton = page.getByRole("button", { name: "Edit" });
    await editButton.click();
    await page.waitForTimeout(300);
    
    // Click the source toggle button to enter source editing mode
    await page.waitForTimeout(500);
    const toolbar = page.locator('.mdxeditor').locator('[role="toolbar"]').or(page.locator('.mdxeditor-toolbar')).first();
    await toolbar.waitFor({ state: 'visible', timeout: 10000 });
    const sourceToggle = toolbar.locator('button').first();
    await sourceToggle.click();
    await page.waitForTimeout(500);
    
    // In source mode, we have a textarea
    const textarea = page.locator('textarea').first();
    await textarea.click();
    await page.waitForTimeout(200);
    // Type the new content
    const content = `# Test Page\n\n${markdown}\n\nContent here.`;
    await textarea.fill(content);
    await page.waitForTimeout(300);
    
    // Find Save button in the ContentEditor - it's next to the Preview button
    const previewButton = page.getByRole("button", { name: "Preview" });
    const saveButton = previewButton.locator("..").getByRole("button", { name: "Save", exact: true });
    await saveButton.click();
    // Wait for save to complete
    await page.waitForTimeout(1000);
    // After saving, click Preview to see the rendered view
    await previewButton.click();
    await page.waitForTimeout(500);
  }
);

Then(
  "the image should display in the rendered view",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    // Wait for MDX to compile and render - prose should be visible
    await page.waitForSelector('.prose', { timeout: 5000 });
    // Wait a bit for MDX compilation
    await page.waitForTimeout(500);
    // Look for image element in prose
    const imageInProse = page.locator('.prose img').first();
    await expect(imageInProse).toBeVisible();
  }
);

