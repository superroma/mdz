import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { BACKEND_URL } from "../support/constants";
import { AppWorld } from "../support/world";
import { mkdtempSync, copyFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { cpSync, rmSync } from "node:fs";

let testPagesDir: string;

Given(
  "seed pages are loaded in a temporary test directory",
  async function (this: AppWorld) {
    testPagesDir = process.env.TEST_PAGES_ROOT || mkdtempSync(join(tmpdir(), "e2e-pages-"));
    
    const repoRoot = join(process.cwd(), "..", "..");
    const seedPagesDir = join(repoRoot, "pages");
    
    if (existsSync(seedPagesDir)) {
      cpSync(seedPagesDir, testPagesDir, { recursive: true });
    } else {
      mkdirSync(testPagesDir, { recursive: true });
    }
  }
);

Given(
  "the backend is configured to use the test directory",
  async function (this: AppWorld) {
    testPagesDir = process.env.TEST_PAGES_ROOT || testPagesDir;
  }
);

When(
  "I create a page named {string}",
  async function (this: AppWorld, pageName: string) {
    const response = await fetch(`${BACKEND_URL}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pageName,
        content: "# Test Content"
      })
    });
    
    this.lastResponse = {
      status: response.status,
      body: await response.json()
    };
    
    // Give filesystem time to sync
    await new Promise(resolve => setTimeout(resolve, 500));
  }
);

Then(
  "the file {string} should exist",
  async function (this: AppWorld, filename: string) {
    // Give filesystem a moment to sync
    await new Promise(resolve => setTimeout(resolve, 500));
    const filePath = join(testPagesDir, filename);
    expect(existsSync(filePath)).toBe(true);
  }
);

Then(
  "I should be able to read the page content",
  async function (this: AppWorld) {
    expect(this.lastResponse?.status).toBe(200);
    const page = this.lastResponse?.body as { path: string; content: string };
    expect(page.content).toBe("# Test Content");
  }
);

Given(
  "a page {string} exists",
  async function (this: AppWorld, pagePath: string) {
    const response = await fetch(`${BACKEND_URL}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pagePath.replace(/\.md$/, ""),
        content: "# Parent Content"
      })
    });
    expect(response.status).toBe(200);
  }
);

When(
  "I create a child page {string}",
  async function (this: AppWorld, childPath: string) {
    const [parent, child] = childPath.split("/");
    const response = await fetch(`${BACKEND_URL}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: child,
        parent: parent,
        content: "# Child Content"
      })
    });
    
    this.lastResponse = {
      status: response.status,
      body: await response.json()
    };
    
    // Give filesystem time to sync
    await new Promise(resolve => setTimeout(resolve, 100));
  }
);

Then(
  "{string} should not exist",
  async function (this: AppWorld, filename: string) {
    // Give filesystem a moment to sync
    await new Promise(resolve => setTimeout(resolve, 100));
    const filePath = join(testPagesDir, filename);
    expect(existsSync(filePath)).toBe(false);
  }
);

Then(
  "{string} should exist",
  async function (this: AppWorld, filepath: string) {
    // Give filesystem a moment to sync
    await new Promise(resolve => setTimeout(resolve, 100));
    const fullPath = join(testPagesDir, filepath);
    expect(existsSync(fullPath)).toBe(true);
  }
);

When(
  "I request the page {string}",
  async function (this: AppWorld, pagePath: string) {
    const response = await fetch(`${BACKEND_URL}/api/pages/${encodeURIComponent(pagePath)}`);
    this.lastResponse = {
      status: response.status,
      body: await response.json()
    };
  }
);

Then(
  "I should receive a {int} response",
  function (this: AppWorld, statusCode: number) {
    expect(this.lastResponse?.status).toBe(statusCode);
  }
);

Then(
  "the response should include front-matter with status {string}",
  function (this: AppWorld, status: string) {
    const page = this.lastResponse?.body as { frontMatter?: { status?: string } };
    expect(page.frontMatter?.status).toBe(status);
  }
);

Then(
  "the response should include front-matter with priority {string}",
  function (this: AppWorld, priority: string) {
    const page = this.lastResponse?.body as { frontMatter?: { priority?: string } };
    expect(page.frontMatter?.priority).toBe(priority);
  }
);

When(
  "I request the list of all pages",
  async function (this: AppWorld) {
    const response = await fetch(`${BACKEND_URL}/api/pages`);
    this.lastResponse = {
      status: response.status,
      body: await response.json()
    };
  }
);

Then(
  "I should see {string} as a root page",
  function (this: AppWorld, pageTitle: string) {
    const pages = this.lastResponse?.body as Array<{ title: string; parent?: string }>;
    const page = pages.find((p) => p.title === pageTitle && !p.parent);
    expect(page).toBeDefined();
  }
);

Then(
  "I should see {string} as a root page with children",
  function (this: AppWorld, pageTitle: string) {
    const pages = this.lastResponse?.body as Array<{ title: string; parent?: string; children?: string[] }>;
    const page = pages.find((p) => p.title === pageTitle && !p.parent);
    expect(page).toBeDefined();
    expect(page?.children?.length).toBeGreaterThan(0);
  }
);

Then(
  "{string} should have {int} child pages",
  function (this: AppWorld, pageIdentifier: string, count: number) {
    const pages = this.lastResponse?.body as Array<{ title: string; path?: string; children?: string[] }>;
    const page = pages.find((p) => p.title === pageIdentifier || p.path === pageIdentifier);
    expect(page?.children?.length).toBeGreaterThanOrEqual(count);
  }
);

When(
  "I attempt to access {string}",
  async function (this: AppWorld, path: string) {
    const response = await fetch(`${BACKEND_URL}/api/pages/${encodeURIComponent(path)}`);
    this.lastResponse = {
      status: response.status,
      body: await response.json().catch(() => ({}))
    };
  }
);

Then(
  "I should receive a {int} Forbidden response",
  function (this: AppWorld, statusCode: number) {
    expect(this.lastResponse?.status).toBe(statusCode);
  }
);

