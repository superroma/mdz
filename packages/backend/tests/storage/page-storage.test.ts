import { afterEach, beforeEach, expect, test } from "vitest";
import { createPage, readPage, updatePage, deletePage, listPages, renamePage } from "../../src/storage/page-storage";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { copyFileSync, mkdirSync } from "node:fs";
import { existsSync } from "node:fs";

let testDir: string;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pages-test-"));
  process.env.PAGES_ROOT = testDir;
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
});

test("createPage creates a new page", () => {
  const page = createPage("Test Page", "# Test\nContent here");
  expect(page.path).toBe("Test Page");
  expect(page.title).toBe("Test Page");
  expect(page.content).toBe("# Test\nContent here");
});

test("readPage reads an existing page", () => {
  createPage("Test Page", "# Test\nContent here");
  const page = readPage("Test Page");
  expect(page).not.toBeNull();
  expect(page?.content).toBe("# Test\nContent here");
});

test("readPage returns null for non-existent page", () => {
  const page = readPage("Non Existent");
  expect(page).toBeNull();
});

test("updatePage updates page content", () => {
  createPage("Test Page", "# Original");
  const updated = updatePage("Test Page", "# Updated");
  expect(updated.content).toBe("# Updated");
});

test("updatePage updates front-matter", () => {
  createPage("Test Page", "# Content", { status: "Draft" });
  const updated = updatePage("Test Page", "# Content", { status: "Published" });
  expect(updated.frontMatter.status).toBe("Published");
});

test("deletePage removes a page", () => {
  createPage("Test Page", "# Content");
  deletePage("Test Page");
  const page = readPage("Test Page");
  expect(page).toBeNull();
});

test("renamePage moves a page", () => {
  createPage("Old Name", "# Content");
  const renamed = renamePage("Old Name", "New Name");
  expect(renamed.path).toBe("New Name");
  expect(readPage("Old Name")).toBeNull();
  expect(readPage("New Name")).not.toBeNull();
});

test("listPages returns all pages", () => {
  createPage("Page 1", "# Content 1");
  createPage("Page 2", "# Content 2");
  const pages = listPages();
  expect(pages.length).toBeGreaterThanOrEqual(2);
  expect(pages.some((p) => p.path === "Page 1")).toBe(true);
  expect(pages.some((p) => p.path === "Page 2")).toBe(true);
});

test("createPage with parent creates child page", () => {
  createPage("Parent", "# Parent Content");
  createPage("Parent/Child", "# Child Content");
  const parent = readPage("Parent");
  const child = readPage("Parent/Child");
  expect(parent).not.toBeNull();
  expect(child).not.toBeNull();
  expect(child?.parent).toBe("Parent");
});

test("folderization converts single file to folder when child added", () => {
  createPage("Parent", "# Parent");
  createPage("Parent/Child", "# Child");
  const parent = readPage("Parent");
  expect(parent).not.toBeNull();
  const { join } = require("node:path");
  const { existsSync } = require("node:fs");
  const pagesRoot = process.env.PAGES_ROOT!;
  expect(existsSync(join(pagesRoot, "Parent/README.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Parent/Child.md"))).toBe(true);
});

