import { Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";

Then(
  "the application should not crash",
  { timeout: 15000 },
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    
    const titleInput = page.getByRole("textbox", { name: "Page title" });
    await expect(titleInput).toBeVisible({ timeout: 10000 });
  }
);

Then(
  "the page should be navigable",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const sidebar = page.getByRole("complementary", { name: "Page navigation sidebar" });
    await expect(sidebar).toBeVisible();
    
    const editButton = page.getByRole("button", { name: "Edit page content" });
    await expect(editButton).toBeVisible();
  }
);

Then(
  "I should be able to interact with the UI",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const titleInput = page.getByRole("textbox", { name: "Page title" });
    await expect(titleInput).toBeEnabled();
    
    const isEditable = await titleInput.isEditable();
    expect(isEditable).toBe(true);
    
    const editButton = page.getByRole("button", { name: "Edit page content" });
    const isClickable = await editButton.isEnabled();
    expect(isClickable).toBe(true);
  }
);
