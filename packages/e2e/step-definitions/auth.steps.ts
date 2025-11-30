import { Given } from "@cucumber/cucumber";
import { AppWorld } from "../support/world";
import { testTokens } from "../support/hooks";
import { TEST_USERS } from "../support/test-users";

Given("I am logged in as {string}", async function (this: AppWorld, email: string) {
  const page = await this.ensurePage();
  
  const role = Object.keys(TEST_USERS).find(r => TEST_USERS[r].email === email);
  
  if (!role || !testTokens[role]) {
    throw new Error(`Unknown test user: ${email}`);
  }

  await page.addInitScript((t) => {
    localStorage.setItem("auth_token", t);
  }, testTokens[role]);

  await page.reload();
});
