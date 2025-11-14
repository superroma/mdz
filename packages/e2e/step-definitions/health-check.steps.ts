import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { HEALTH_ENDPOINT } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";
import { AppWorld } from "../support/world";
import { setupPage } from "../support/test-helpers";

Given(
  "the backend server is running",
  async function (this: AppWorld) {
    await ensureServersRunning();
  }
);

When(
  "I request the health check endpoint",
  async function (this: AppWorld) {
    const response = await fetch(HEALTH_ENDPOINT);
    const body = await response.json();

    this.lastResponse = {
      status: response.status,
      body
    };
  }
);

Then(
  "I should receive a successful response",
  function (this: AppWorld) {
    expect(this.lastResponse?.status).toBe(200);
    expect(this.lastResponse?.body).toMatchObject({
      status: "ok"
    });
  }
);

Given(
  "the frontend application is running",
  async function (this: AppWorld) {
    await ensureServersRunning();
  }
);

When(
  "I navigate to the homepage",
  async function (this: AppWorld) {
    await setupPage(this);
  }
);

Then(
  "I should see the application interface",
  async function (this: AppWorld) {
    const page = await this.ensurePage();
    await expect(
      page.getByRole("heading", { name: /Pages/i })
    ).toBeVisible();
  }
);

