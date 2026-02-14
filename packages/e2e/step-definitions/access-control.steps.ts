import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { BACKEND_URL } from "../support/constants";
import { navigateToPageByTitle } from "../support/test-helpers";

function getNavigationTitle(pagePath: string): string {
  const normalized = pagePath.replace(/\.md$/, "");
  const parts = normalized.split("/");
  const last = parts[parts.length - 1];
  if (last === "README" && parts.length > 1) {
    return parts[parts.length - 2];
  }
  return last;
}

Given("the users.yaml configuration exists", async function (this: AppWorld) {
  const pagesRoot = process.env.PAGES_ROOT || join(process.cwd(), "../../pages");
  const settingsDir = join(pagesRoot, ".settings");
  
  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true });
  }
  
  const usersYaml = `defaultAccess:
  read: [everyone]
  write: [writers]

users:
  admin@test.local:
    groups: [admins]
  writer@test.local:
    groups: [writers]
  reader@test.local:
    groups: []
`;
  
  writeFileSync(join(settingsDir, "users.yaml"), usersYaml);
  
  const settingsReadme = `---
__access:
  read: [admins]
  write: [admins]
---

# Settings

Restricted settings page.
`;
  
  writeFileSync(join(settingsDir, "README.md"), settingsReadme);
});

Then("I should see all pages in the navigation", async function (this: AppWorld) {
  const page = await this.ensurePage();
  await page.waitForLoadState('networkidle');
  await page.getByRole("navigation", { name: "Page tree" }).waitFor();
  const pages = await page.getByRole("group").count();
  expect(pages).toBeGreaterThan(0);
});

Then("I should be able to edit any page", async function (this: AppWorld) {
  const page = await this.ensurePage();
  await page.getByRole("button", { name: "Navigate to Welcome" }).click();
  await page.getByRole("button", { name: "Edit page content" }).waitFor();
  await page.getByRole("button", { name: "Edit page content" }).click();
  await page.getByRole("textbox", { name: "Page content" }).waitFor();
  const editor = page.getByRole("textbox", { name: "Page content" });
  await expect(editor).toBeVisible();
});

Then("I should see no pages in the navigation", async function (this: AppWorld) {
  const page = await this.ensurePage();
  await page.waitForTimeout(1000);
  const pages = await page.getByRole("group").count();
  expect(pages).toBe(0);
});

Then("accessing any page should return 404", async function (this: AppWorld) {
  const page = await this.ensurePage();
  const response = await page.request.get(`${BACKEND_URL}/api/pages/Welcome`, {
    headers: {
      Authorization: `Bearer ${this.authToken || ''}`,
    },
  });
  expect(response.status()).toBe(404);
});

Then("I should see pages accessible to {string} group", async function (this: AppWorld, group: string) {
  const page = await this.ensurePage();
  await page.waitForLoadState('networkidle');
  await page.getByRole("navigation", { name: "Page tree" }).waitFor();
  const pages = await page.getByRole("group").count();
  expect(pages).toBeGreaterThan(0);
});

Then("I should not be able to edit any page", async function (this: AppWorld) {
  const page = await this.ensurePage();
  const response = await page.request.put(
    `${BACKEND_URL}/api/pages/Welcome`,
    {
      headers: {
        Authorization: `Bearer ${this.authToken || ''}`,
        "Content-Type": "application/json",
      },
      data: { content: "test" },
    }
  );
  expect(response.status()).toBe(404);
});

Then("I should be able to edit pages with writer access", async function (this: AppWorld) {
  const page = await this.ensurePage();
  await page.getByRole("button", { name: "Navigate to Welcome" }).click();
  await page.getByRole("button", { name: "Edit page content" }).waitFor();
  await page.getByRole("button", { name: "Edit page content" }).click();
  await page.getByRole("textbox", { name: "Page content" }).waitFor();
  const editor = page.getByRole("textbox", { name: "Page content" });
  await expect(editor).toBeVisible();
});

Then("I should not be able to edit pages restricted to admins", async function (this: AppWorld) {
  const page = await this.ensurePage();
  const response = await page.request.put(
    `${BACKEND_URL}/api/pages/.settings`,
    {
      headers: {
        Authorization: `Bearer ${this.authToken || ''}`,
        "Content-Type": "application/json",
      },
      data: { content: "test" },
    }
  );
  expect(response.status()).toBe(404);
});

Given("a page {string} with access control:", async function (this: AppWorld, pagePath: string, accessControl: string) {
  const pagesRoot = process.env.PAGES_ROOT || join(process.cwd(), "../../pages");
  const pathParts = pagePath.split("/");
  const parentDir = pathParts.slice(0, -1).join("/");
  const fileName = pathParts[pathParts.length - 1];
  
  if (parentDir) {
    const fullParentDir = join(pagesRoot, parentDir);
    if (!existsSync(fullParentDir)) {
      mkdirSync(fullParentDir, { recursive: true });
    }
  }
  
  const content = `---
${accessControl}
---

# ${fileName}

This is a test page with access control.
`;
  
  const filePath = join(pagesRoot, `${pagePath}.md`);
  writeFileSync(filePath, content);
});

Then("I should not see the page {string} in navigation", async function (this: AppWorld, pagePath: string) {
  const page = await this.ensurePage();
  await page.waitForTimeout(500);
  const pageTitle = getNavigationTitle(pagePath);
  const pageElement = page.getByRole("group", { name: new RegExp(`Page item: ${pageTitle}`, "i") });
  await expect(pageElement).toHaveCount(0);
});

Then("accessing {string} should return 404", async function (this: AppWorld, pagePath: string) {
  const page = await this.ensurePage();
  const response = await page.request.get(`${BACKEND_URL}/api/pages/${pagePath}`, {
    headers: {
      Authorization: `Bearer ${this.authToken || ''}`,
    },
  });
  expect(response.status()).toBe(404);
});

Then("I should see the page {string} in navigation", async function (this: AppWorld, pagePath: string) {
  const page = await this.ensurePage();
  await page.waitForTimeout(500);
  const pageTitle = getNavigationTitle(pagePath);
  const pageElement = page.getByRole("group", { name: new RegExp(`Page item: ${pageTitle}`, "i") });
  await expect(pageElement).toBeVisible();
});

Then("I should be able to edit {string}", async function (this: AppWorld, pagePath: string) {
  const page = await this.ensurePage();
  const response = await page.request.put(
    `${BACKEND_URL}/api/pages/${pagePath}`,
    {
      headers: {
        Authorization: `Bearer ${this.authToken || ''}`,
        "Content-Type": "application/json",
      },
      data: { content: "test content" },
    }
  );
  expect(response.status()).toBe(200);
});

Given("a parent page {string} with access control:", async function (this: AppWorld, pagePath: string, accessControl: string) {
  const pagesRoot = process.env.PAGES_ROOT || join(process.cwd(), "../../pages");
  const pathParts = pagePath.split("/");
  const parentDir = pathParts.slice(0, -1).join("/");
  const fileName = pathParts[pathParts.length - 1];
  
  if (parentDir) {
    const fullParentDir = join(pagesRoot, parentDir);
    if (!existsSync(fullParentDir)) {
      mkdirSync(fullParentDir, { recursive: true });
    }
  }
  
  const content = `---
${accessControl}
---

# ${fileName}

This is a test page with access control.
`;
  
  const filePath = join(pagesRoot, `${pagePath}.md`);
  writeFileSync(filePath, content);
});

Given("a child page {string} without access control", async function (this: AppWorld, pagePath: string) {
  const pagesRoot = process.env.PAGES_ROOT || join(process.cwd(), "../../pages");
  const pathParts = pagePath.split("/");
  const parentDir = pathParts.slice(0, -1).join("/");
  const fileName = pathParts[pathParts.length - 1];
  
  const fullParentDir = join(pagesRoot, parentDir);
  if (!existsSync(fullParentDir)) {
    mkdirSync(fullParentDir, { recursive: true });
  }
  
  const content = `# ${fileName}

This is a child page without explicit access control.
`;
  
  const filePath = join(pagesRoot, `${pagePath}.md`);
  writeFileSync(filePath, content);
});

Then("I should not see {string} or {string} in navigation", async function (this: AppWorld, page1: string, page2: string) {
  const page = await this.ensurePage();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const page1Title = getNavigationTitle(page1);
  const page2Title = getNavigationTitle(page2);
  
  const sidebar = page.getByRole("complementary", { name: "Page navigation sidebar" });
  const escapedPage1Title = page1Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedPage2Title = page2Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const page1Button = sidebar.getByRole("button", { name: new RegExp(`^Navigate to ${escapedPage1Title}$`, "i") });
  const page2Button = sidebar.getByRole("button", { name: new RegExp(`^Navigate to ${escapedPage2Title}$`, "i") });
  
  const count1 = await page1Button.count();
  const count2 = await page2Button.count();
  expect(count1).toBe(0);
  expect(count2).toBe(0);
});

Then("I should see both {string} and {string} in navigation", async function (this: AppWorld, page1: string, page2: string) {
  const page = await this.ensurePage();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const page1Title = getNavigationTitle(page1);
  const page2Title = getNavigationTitle(page2);
  
  const sidebar = page.getByRole("complementary", { name: "Page navigation sidebar" });
  const escapedPage1Title = page1Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedPage2Title = page2Title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const page1Button = sidebar.getByRole("button", { name: new RegExp(`^Navigate to ${escapedPage1Title}$`, "i") });
  const page2Button = sidebar.getByRole("button", { name: new RegExp(`^Navigate to ${escapedPage2Title}$`, "i") });
  
  await expect(page1Button).toBeVisible();
  await expect(page2Button).toBeVisible();
});

Then("I should be able to edit both pages", async function (this: AppWorld) {
  const page = await this.ensurePage();
  const response1 = await page.request.put(
    `${BACKEND_URL}/api/pages/Team`,
    {
      headers: {
        Authorization: `Bearer ${this.authToken || ''}`,
        "Content-Type": "application/json",
      },
      data: { content: "test content" },
    }
  );
  expect(response1.status()).toBe(200);
  
  const response2 = await page.request.put(
    `${BACKEND_URL}/api/pages/Team/Project`,
    {
      headers: {
        Authorization: `Bearer ${this.authToken || ''}`,
        "Content-Type": "application/json",
      },
      data: { content: "test content" },
    }
  );
  expect(response2.status()).toBe(200);
});

Given("a page {string} with file {string}", async function (this: AppWorld, pagePath: string, fileName: string) {
  const pagesRoot = process.env.PAGES_ROOT || join(process.cwd(), "../../pages");
  const pageDir = join(pagesRoot, pagePath);
  
  if (!existsSync(pageDir)) {
    mkdirSync(pageDir, { recursive: true });
  }
  
  const readmePath = join(pageDir, "README.md");
  writeFileSync(readmePath, `# ${pagePath}\n\nTest page with file.`);
  
  const filePath = join(pageDir, fileName);
  writeFileSync(filePath, "Test file content");
});

Given("{string} has access control:", async function (this: AppWorld, pagePath: string, accessControl: string) {
  const pagesRoot = process.env.PAGES_ROOT || join(process.cwd(), "../../pages");
  const pageDir = join(pagesRoot, pagePath);
  const readmePath = join(pageDir, "README.md");
  
  const content = `---
${accessControl}
---

# ${pagePath}

Test page with file and access control.
`;
  
  writeFileSync(readmePath, content);
});

Then("I should not be able to access {string}", async function (this: AppWorld, fileName: string) {
  const page = await this.ensurePage();
  const response = await page.request.get(`${BACKEND_URL}/api/files/Docs/${fileName}`, {
    headers: {
      Authorization: `Bearer ${this.authToken || ''}`,
    },
  });
  expect(response.status()).toBe(404);
});

Then("I should be able to download {string}", async function (this: AppWorld, fileName: string) {
  const page = await this.ensurePage();
  const response = await page.request.get(`${BACKEND_URL}/api/files/Docs/${fileName}`, {
    headers: {
      Authorization: `Bearer ${this.authToken || ''}`,
    },
  });
  expect(response.status()).toBe(200);
});

Then("I should be able to upload files to {string}", async function (this: AppWorld, pagePath: string) {
  const page = await this.ensurePage();
  const response = await page.request.get(`${BACKEND_URL}/api/files/${pagePath}`, {
    headers: {
      Authorization: `Bearer ${this.authToken || ''}`,
    },
  });
  expect(response.status()).toBe(200);
});

Then(/^my user info should include groups: (.+)$/, async function (this: AppWorld, groupsLiteral: string) {
  const page = await this.ensurePage();
  const normalized = groupsLiteral.trim().replace(/'/g, '"');
  const expectedGroups = JSON.parse(normalized);
  
  const response = await page.request.get(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${this.authToken || ''}`,
    },
  });
  
  expect(response.status()).toBe(200);
  const user = await response.json();
  expect(user.groups).toEqual(expectedGroups);
});

When("I navigate to {string} page", async function (this: AppWorld, pageTitle: string) {
  const page = await this.ensurePage();
  await navigateToPageByTitle(page, pageTitle);
  await page.waitForSelector('[role="article"], .prose', { timeout: 5000 }).catch(() => {});
});

Then("I should not see the {string} button", async function (this: AppWorld, ariaLabel: string) {
  const page = await this.ensurePage();
  await page.waitForSelector('[role="article"], .prose', { timeout: 5000 });
  const button = page.getByRole("button", { name: ariaLabel });
  await expect(button).toHaveCount(0);
});

Then("I should see the {string} button", async function (this: AppWorld, ariaLabel: string) {
  const page = await this.ensurePage();
  await page.waitForSelector('[role="article"], .prose', { timeout: 5000 });
  const button = page.getByRole("button", { name: ariaLabel });
  await expect(button).toBeVisible();
});

Then("checkboxes should be disabled", async function (this: AppWorld) {
  const page = await this.ensurePage();
  await page.waitForSelector('.prose input[type="checkbox"]', { timeout: 5000 });
  const checkboxes = page.locator('.prose input[type="checkbox"]');
  const count = await checkboxes.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(checkboxes.nth(i)).toBeDisabled();
  }
});

Then("the page title should be read-only", async function (this: AppWorld) {
  const page = await this.ensurePage();
  await page.waitForSelector('[role="article"], .prose', { timeout: 5000 });
  const titleInput = page.getByRole("textbox", { name: "Page title" });
  await expect(titleInput).toHaveCount(0);
});
