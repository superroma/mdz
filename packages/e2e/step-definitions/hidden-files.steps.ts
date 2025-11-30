import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Note: "a page {string} exists" step is defined in storage.steps.ts

Given("a non-markdown file {string} exists", async function (this: AppWorld, fileName: string) {
  // Get the test pages root from environment
  const testDir = process.env.TEST_PAGES_ROOT;
  
  if (!testDir) {
    throw new Error("TEST_PAGES_ROOT not set");
  }

  // Create a non-markdown file directly in the filesystem
  const filePath = join(testDir, fileName);
  writeFileSync(filePath, "fake file content");
  
  const page = await this.ensurePage();
  
  // Reload pages to pick up the new file
  await page.reload();
  await page.waitForLoadState("networkidle");
});

When("I view the sidebar", async function (this: AppWorld) {
  const page = await this.ensurePage();
  
  await page.getByRole("complementary", { name: "Page navigation sidebar" }).waitFor({ state: "visible" });
});

When("I click the show hidden files toggle", async function (this: AppWorld) {
  const page = await this.ensurePage();
  
  const toggleButton = page.getByRole("button", { name: "Toggle hidden files" });
  await toggleButton.click();
  
  await page.waitForResponse(resp => resp.url().includes('/api/pages'), { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(300);
});

Then("I should see {string} in the sidebar", async function (this: AppWorld, pageName: string) {
  const page = await this.ensurePage();
  
  await page.getByRole("navigation", { name: "Page tree" }).waitFor({ state: "visible" });
  
  const sidebar = page.getByRole("complementary", { name: "Page navigation sidebar" });
  const pageLink = sidebar.getByRole("button", { name: `Navigate to ${pageName}` });
  await expect(pageLink).toBeVisible({ timeout: 10000 });
});

Then("I should not see {string} in the sidebar", async function (this: AppWorld, pageName: string) {
  const page = await this.ensurePage();
  
  await page.getByRole("navigation", { name: "Page tree" }).waitFor({ state: "visible" });
  
  const sidebar = page.getByRole("complementary", { name: "Page navigation sidebar" });
  const pageLink = sidebar.getByRole("button", { name: `Navigate to ${pageName}` });
  await expect(pageLink).not.toBeVisible();
});

Then("the file {string} should not be clickable", async function (this: AppWorld, fileName: string) {
  const page = await this.ensurePage();
  
  const fileElement = page.getByRole("button", { name: `Navigate to ${fileName}` });
  await expect(fileElement).toBeVisible();
  
  const classes = await fileElement.getAttribute("class");
  expect(classes).toContain("cursor-default");
});
