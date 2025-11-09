import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { FRONTEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";

Given(
  "I am using a desktop screen size",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  }
);

Given(
  "I am using a mobile screen size",
  async function (this: AppWorld) {
    await ensureServersRunning();
    const page = await this.ensurePage();
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  }
);

Given(
  "the sidebar is hidden",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeHidden();
  }
);

When(
  "I click the hamburger button",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const hamburger = page.getByRole("button", { name: "Toggle sidebar" });
    await hamburger.click();
  }
);

Then(
  "the sidebar should be visible",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  }
);

Then(
  "the hamburger button should be hidden",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const hamburger = page.getByRole("button", { name: "Toggle sidebar" });
    await expect(hamburger).toBeHidden();
  }
);

Then(
  "the sidebar should be hidden",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeHidden();
  }
);

Then(
  "the hamburger button should be visible",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const hamburger = page.getByRole("button", { name: "Toggle sidebar" });
    await expect(hamburger).toBeVisible();
  }
);

Then(
  "the sidebar should become visible",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  }
);

