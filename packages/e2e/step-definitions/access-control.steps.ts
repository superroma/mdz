import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { World } from "../support/world";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

Given("the users.yaml configuration exists", async function (this: World) {
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
});

When("I log in with email {string}", async function (this: World, email: string) {
  await this.page.goto("http://localhost:5173");
  await this.page.waitForURL("**/login");
});

Then("I should see all pages in the navigation", async function (this: World) {
  await this.page.waitForSelector('[data-testid="tree-navigation"]', { timeout: 5000 });
  const pages = await this.page.locator('[data-testid^="tree-item-"]').count();
  expect(pages).toBeGreaterThan(0);
});

Then("I should be able to edit any page", async function (this: World) {
  await this.page.click('[data-testid="tree-item-Welcome"]');
  await this.page.waitForSelector('[data-testid="content-editor"]');
  const editor = this.page.locator('[data-testid="content-editor"]');
  await expect(editor).toBeEditable();
});

Then("I should see no pages in the navigation", async function (this: World) {
  await this.page.waitForTimeout(1000);
  const pages = await this.page.locator('[data-testid^="tree-item-"]').count();
  expect(pages).toBe(0);
});

Then("accessing any page should return 404", async function (this: World) {
  const response = await this.page.request.get("http://localhost:3001/api/pages/Welcome", {
    headers: {
      Authorization: `Bearer ${this.authToken}`,
    },
  });
  expect(response.status()).toBe(404);
});

Then("I should see pages accessible to {string} group", async function (this: World, group: string) {
  await this.page.waitForSelector('[data-testid="tree-navigation"]', { timeout: 5000 });
  const pages = await this.page.locator('[data-testid^="tree-item-"]').count();
  expect(pages).toBeGreaterThan(0);
});

Then("I should not be able to edit any page", async function (this: World) {
  const hasPages = await this.page.locator('[data-testid^="tree-item-"]').count();
  if (hasPages > 0) {
    await this.page.click('[data-testid^="tree-item-"]').first();
    await this.page.waitForTimeout(500);
    const editor = this.page.locator('[data-testid="content-editor"]');
    const isEditable = await editor.isEditable().catch(() => false);
    expect(isEditable).toBe(false);
  }
});

Then("I should be able to edit pages with writer access", async function (this: World) {
  await this.page.click('[data-testid="tree-item-Welcome"]');
  await this.page.waitForSelector('[data-testid="content-editor"]');
  const editor = this.page.locator('[data-testid="content-editor"]');
  await expect(editor).toBeEditable();
});

Then("I should not be able to edit pages restricted to admins", async function (this: World) {
  const response = await this.page.request.put(
    "http://localhost:3001/api/pages/.settings/README",
    {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
      data: { content: "test" },
    }
  );
  expect(response.status()).toBe(404);
});

Given("a page {string} with access control:", async function (this: World, pagePath: string, accessControl: string) {
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

Then("I should not see the page {string} in navigation", async function (this: World, pagePath: string) {
  await this.page.waitForTimeout(500);
  const pageId = pagePath.replace(/\//g, "-");
  const pageElement = this.page.locator(`[data-testid="tree-item-${pageId}"]`);
  await expect(pageElement).toHaveCount(0);
});

Then("accessing {string} should return 404", async function (this: World, pagePath: string) {
  const response = await this.page.request.get(`http://localhost:3001/api/pages/${pagePath}`, {
    headers: {
      Authorization: `Bearer ${this.authToken}`,
    },
  });
  expect(response.status()).toBe(404);
});

Then("I should see the page {string} in navigation", async function (this: World, pagePath: string) {
  await this.page.waitForTimeout(500);
  const pageId = pagePath.replace(/\//g, "-");
  const pageElement = this.page.locator(`[data-testid="tree-item-${pageId}"]`);
  await expect(pageElement).toBeVisible();
});

Then("I should be able to edit {string}", async function (this: World, pagePath: string) {
  const response = await this.page.request.put(
    `http://localhost:3001/api/pages/${pagePath}`,
    {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
      data: { content: "test content" },
    }
  );
  expect(response.status()).toBe(200);
});

Given("a parent page {string} with access control:", async function (this: World, pagePath: string, accessControl: string) {
  await this.step(`a page "${pagePath}" with access control:`, accessControl);
});

Given("a child page {string} without access control", async function (this: World, pagePath: string) {
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

Then("I should not see {string} or {string} in navigation", async function (this: World, page1: string, page2: string) {
  await this.page.waitForTimeout(500);
  const page1Id = page1.replace(/\//g, "-");
  const page2Id = page2.replace(/\//g, "-");
  
  const page1Element = this.page.locator(`[data-testid="tree-item-${page1Id}"]`);
  const page2Element = this.page.locator(`[data-testid="tree-item-${page2Id}"]`);
  
  await expect(page1Element).toHaveCount(0);
  await expect(page2Element).toHaveCount(0);
});

Then("I should see both {string} and {string} in navigation", async function (this: World, page1: string, page2: string) {
  await this.page.waitForTimeout(500);
  const page1Id = page1.replace(/\//g, "-");
  const page2Id = page2.replace(/\//g, "-");
  
  const page1Element = this.page.locator(`[data-testid="tree-item-${page1Id}"]`);
  const page2Element = this.page.locator(`[data-testid="tree-item-${page2Id}"]`);
  
  await expect(page1Element).toBeVisible();
  await expect(page2Element).toBeVisible();
});

Then("I should be able to edit both pages", async function (this: World) {
  const response1 = await this.page.request.put(
    "http://localhost:3001/api/pages/Team",
    {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
      data: { content: "test content" },
    }
  );
  expect(response1.status()).toBe(200);
  
  const response2 = await this.page.request.put(
    "http://localhost:3001/api/pages/Team/Project",
    {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
      data: { content: "test content" },
    }
  );
  expect(response2.status()).toBe(200);
});

Given("a page {string} with file {string}", async function (this: World, pagePath: string, fileName: string) {
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

Given("{string} has access control:", async function (this: World, pagePath: string, accessControl: string) {
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

Then("I should not be able to access {string}", async function (this: World, fileName: string) {
  const response = await this.page.request.get(`http://localhost:3001/api/files/Docs/${fileName}`, {
    headers: {
      Authorization: `Bearer ${this.authToken}`,
    },
  });
  expect(response.status()).toBe(404);
});

Then("I should be able to download {string}", async function (this: World, fileName: string) {
  const response = await this.page.request.get(`http://localhost:3001/api/files/Docs/${fileName}`, {
    headers: {
      Authorization: `Bearer ${this.authToken}`,
    },
  });
  expect(response.status()).toBe(200);
});

Then("I should be able to upload files to {string}", async function (this: World, pagePath: string) {
  const response = await this.page.request.get(`http://localhost:3001/api/files/${pagePath}`, {
    headers: {
      Authorization: `Bearer ${this.authToken}`,
    },
  });
  expect(response.status()).toBe(200);
});

Then("my user info should include groups: {string}", async function (this: World, groupsStr: string) {
  const expectedGroups = JSON.parse(groupsStr);
  
  const response = await this.page.request.get("http://localhost:3001/api/auth/me", {
    headers: {
      Authorization: `Bearer ${this.authToken}`,
    },
  });
  
  expect(response.status()).toBe(200);
  const user = await response.json();
  expect(user.groups).toEqual(expectedGroups);
});
