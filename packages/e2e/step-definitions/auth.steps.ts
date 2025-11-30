import { Given } from "@cucumber/cucumber";
import { AppWorld } from "../support/world";
import { testTokens } from "../support/hooks";

Given("I am logged in as {string}", async function (this: AppWorld, email: string) {
  const page = await this.ensurePage();
  
  let token: string;
  if (email === "admin@example.com") {
    token = testTokens.admin;
  } else if (email === "writer@example.com") {
    token = testTokens.writer;
  } else if (email === "reader@example.com") {
    token = testTokens.reader;
  } else {
    throw new Error(`Unknown test user: ${email}`);
  }

  await page.addInitScript((t) => {
    localStorage.setItem("auth_token", t);
  }, token);

  await page.reload();
});
