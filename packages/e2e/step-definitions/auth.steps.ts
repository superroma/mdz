import { Given } from "@cucumber/cucumber";
import { AppWorld } from "../support/world";
import { FRONTEND_URL } from "../support/constants";
import { testTokens } from "../support/hooks";
import { TEST_USERS } from "../support/test-users";

Given("I am not logged in", async function (this: AppWorld) {
  await this.setAuthToken(undefined);
  await this.resetBrowser();
});

Given("I am logged in as {string}", async function (this: AppWorld, email: string) {
  const role = Object.keys(TEST_USERS).find(r => TEST_USERS[r].email === email);
  
  if (!role || !testTokens[role]) {
    throw new Error(`Unknown test user: ${email}`);
  }

  await this.setAuthToken(testTokens[role]);
  await this.resetBrowser();
  const page = await this.ensurePage();
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
});
