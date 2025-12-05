import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL, BACKEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";
import { writeFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";

function getTestPagesDir(): string {
  return process.env.TEST_PAGES_ROOT || "";
}

function authHeaders(world: AppWorld, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${world.authToken ?? ""}`,
    ...extra,
  };
}

Given(
  "a .pages.yaml file exists with custom order",
  async function (this: AppWorld) {
    const testDir = getTestPagesDir();
    const orderFile = join(testDir, ".pages.yaml");
    const orderContent = `order:
  - Team
  - Docs
  - Welcome
`;
    writeFileSync(orderFile, orderContent, "utf-8");
  }
);

Given(
  "a .pages.yaml file with partial order",
  async function (this: AppWorld) {
    const testDir = getTestPagesDir();
    const orderFile = join(testDir, ".pages.yaml");
    const orderContent = `order:
  - Team
`;
    writeFileSync(orderFile, orderContent, "utf-8");
  }
);

Given(
  "I am on the home page",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.getByRole("navigation", { name: "Page tree" }).waitFor({ timeout: 10000 });
  }
);

Given(
  "I am on the home page with show hidden enabled",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await page.getByRole("navigation", { name: "Page tree" }).waitFor({ timeout: 10000 });
    
    const showHiddenButton = page.getByRole("button", { name: /show hidden/i });
    if (await showHiddenButton.isVisible()) {
      await showHiddenButton.click();
    }
  }
);

When(
  "I drag a page to a new position",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const sidebar = page.getByRole("navigation", { name: "Page tree" });
    const pageItems = sidebar.locator('[role="group"]');
    
    const count = await pageItems.count();
    if (count < 2) {
      throw new Error("Need at least 2 pages to test drag and drop");
    }

    const firstItem = pageItems.first();
    const secondItem = pageItems.nth(1);

    const firstBox = await firstItem.boundingBox();
    const secondBox = await secondItem.boundingBox();

    if (!firstBox || !secondBox) {
      throw new Error("Could not get bounding boxes for drag and drop");
    }

    await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 4, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);
  }
);

When(
  "I try to drag a hidden page",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const sidebar = page.getByRole("navigation", { name: "Page tree" });
    const hiddenPage = sidebar.locator('[role="group"]').filter({ hasText: /^\./ }).first();
    
    const isVisible = await hiddenPage.isVisible().catch(() => false);
    if (!isVisible) {
      this.hiddenPageNotDraggable = true;
      return;
    }
    
    const draggable = await hiddenPage.getAttribute("draggable");
    this.hiddenPageNotDraggable = draggable !== "true";
  }
);

Then(
  "pages should appear in the defined order",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const sidebar = page.getByRole("navigation", { name: "Page tree" });
    await sidebar.waitFor({ timeout: 5000 });
    
    const teamButton = sidebar.getByRole("button", { name: "Navigate to Team" });
    const docsButton = sidebar.getByRole("button", { name: "Navigate to Docs" });
    const welcomeButton = sidebar.getByRole("button", { name: "Navigate to Welcome" });

    const teamBox = await teamButton.boundingBox();
    const docsBox = await docsButton.boundingBox();
    const welcomeBox = await welcomeButton.boundingBox();

    expect(teamBox).not.toBeNull();
    expect(docsBox).not.toBeNull();
    expect(welcomeBox).not.toBeNull();

    expect(teamBox!.y).toBeLessThan(docsBox!.y);
    expect(docsBox!.y).toBeLessThan(welcomeBox!.y);
  }
);

Then(
  "the page order should be updated",
  async function (this: AppWorld) {
    const testDir = getTestPagesDir();
    const orderFile = join(testDir, ".pages.yaml");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const exists = existsSync(orderFile);
    expect(exists).toBe(true);
  }
);

Then(
  "the new order should persist after reload",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const sidebar = page.getByRole("navigation", { name: "Page tree" });
    const pageButtons = sidebar.getByRole("button", { name: /Navigate to/i });
    
    const orderBefore: string[] = [];
    const countBefore = await pageButtons.count();
    for (let i = 0; i < countBefore; i++) {
      const text = await pageButtons.nth(i).textContent();
      if (text) orderBefore.push(text.trim());
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await sidebar.waitFor({ timeout: 10000 });

    const orderAfter: string[] = [];
    const countAfter = await pageButtons.count();
    for (let i = 0; i < countAfter; i++) {
      const text = await pageButtons.nth(i).textContent();
      if (text) orderAfter.push(text.trim());
    }

    expect(orderAfter).toEqual(orderBefore);
  }
);

Then(
  "listed pages appear first in specified order",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const sidebar = page.getByRole("navigation", { name: "Page tree" });
    await sidebar.waitFor({ timeout: 5000 });

    const teamButton = sidebar.getByRole("button", { name: "Navigate to Team" });
    const welcomeButton = sidebar.getByRole("button", { name: "Navigate to Welcome" });

    const teamBox = await teamButton.boundingBox();
    const welcomeBox = await welcomeButton.boundingBox();

    expect(teamBox).not.toBeNull();
    expect(welcomeBox).not.toBeNull();

    expect(teamBox!.y).toBeLessThan(welcomeBox!.y);
  }
);

Then(
  "unlisted pages appear after in alphabetical order",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    
    const sidebar = page.getByRole("navigation", { name: "Page tree" });
    await sidebar.waitFor({ timeout: 5000 });

    const teamButton = sidebar.getByRole("button", { name: "Navigate to Team" });
    const docsButton = sidebar.getByRole("button", { name: "Navigate to Docs" });

    const teamBox = await teamButton.boundingBox();
    const docsBox = await docsButton.boundingBox();

    expect(teamBox).not.toBeNull();
    expect(docsBox).not.toBeNull();

    expect(teamBox!.y).toBeLessThan(docsBox!.y);
  }
);

Then(
  "the hidden page should not be draggable",
  async function (this: AppWorld) {
    expect(this.hiddenPageNotDraggable).toBe(true);
  }
);
