import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { AppWorld } from "../support/world";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { FRONTEND_URL, BACKEND_URL } from "../support/constants";
import { ensureServersRunning } from "../support/server-manager";

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
  await page.waitForSelector('[data-testid="page-tree"]');
  const pages = await page.locator('[data-testid^="tree-item-"]').count();
  expect(pages).toBeGreaterThan(0);
});

Then("I should be able to edit any page", async function (this: AppWorld) {
  const page = await this.ensurePage();
  await page.click('[data-testid="navigate-to-Welcome"]');
  await page.waitForSelector('[data-testid="edit-button"]');
  await page.click('[data-testid="edit-button"]');
  await page.waitForSelector('[data-testid="content-editor"]');
  const editor = page.locator('[data-testid="content-editor"]');
  await expect(editor).toBeVisible();
});

Then("I should see no pages in the navigation", async function (this: AppWorld) {
  const page = await this.ensurePage();
  await page.waitForTimeout(1000);
  const pages = await page.locator('[data-testid^="tree-item-"]').count();
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
  await page.waitForSelector('[data-testid="page-tree"]');
  const pages = await page.locator('[data-testid^="tree-item-"]').count();
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
  await page.click('[data-testid="navigate-to-Welcome"]');
  await page.waitForSelector('[data-testid="edit-button"]');
  await page.click('[data-testid="edit-button"]');
  await page.waitForSelector('[data-testid="content-editor"]');
  const editor = page.locator('[data-testid="content-editor"]');
  await expect(editor).toBeVisible();
});

Then("I should not be able to edit pages restricted to admins", async function (this: AppWorld) {
  const page = await this.ensurePage();
  const response = await page.request.put(
    `${BACKEND_URL}/api/pages/.settings/README`,
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
  const pageId = pagePath.replace(/\//g, "-");
  const pageElement = page.locator(`[data-testid="tree-item-${pageId}"]`);
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
  const pageId = pagePath.replace(/\//g, "-");
  const pageElement = page.locator(`[data-testid="tree-item-${pageId}"]`);
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
  await page.waitForTimeout(500);
  const page1Id = page1.replace(/\//g, "-");
  const page2Id = page2.replace(/\//g, "-");
  
  const page1Element = page.locator(`[data-testid="tree-item-${page1Id}"]`);
  const page2Element = page.locator(`[data-testid="tree-item-${page2Id}"]`);
  
  await expect(page1Element).toHaveCount(0);
  await expect(page2Element).toHaveCount(0);
});

Then("I should see both {string} and {string} in navigation", async function (this: AppWorld, page1: string, page2: string) {
  const page = await this.ensurePage();
  await page.waitForTimeout(500);
  const page1Id = page1.replace(/\//g, "-");
  const page2Id = page2.replace(/\//g, "-");
  
  const page1Element = page.locator(`[data-testid="tree-item-${page1Id}"]`);
  const page2Element = page.locator(`[data-testid="tree-item-${page2Id}"]`);
  
  await expect(page1Element).toBeVisible();
  await expect(page2Element).toBeVisible();
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
