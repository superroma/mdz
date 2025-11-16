import { afterEach, beforeEach, expect, test } from "vitest";
import { createPage, readPage, updatePage, deletePage, listPages, renamePage } from "../../src/storage/page-storage";
import { listFiles } from "../../src/storage/file-storage";
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
  createPage("Test Page", "---\nstatus: Draft\n---\n# Content");
  const updated = updatePage("Test Page", "---\nstatus: Published\n---\n# Content");
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

test("defolderization converts folder back to single file when last child removed", () => {
  const { join } = require("node:path");
  const { existsSync } = require("node:fs");
  const pagesRoot = process.env.PAGES_ROOT!;
  
  // Create parent and child (parent becomes folder)
  createPage("Parent", "# Parent");
  createPage("Parent/Child", "# Child");
  
  // Verify folder structure exists
  expect(existsSync(join(pagesRoot, "Parent/README.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Parent/Child.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Parent.md"))).toBe(false);
  
  // Delete the child
  deletePage("Parent/Child");
  
  // Verify parent is converted back to single file
  expect(existsSync(join(pagesRoot, "Parent.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Parent/README.md"))).toBe(false);
  expect(existsSync(join(pagesRoot, "Parent"))).toBe(false);
  
  // Verify parent page still works
  const parent = readPage("Parent");
  expect(parent).not.toBeNull();
  expect(parent?.content).toBe("# Parent");
});

test("defolderization works with nested paths", () => {
  const { join } = require("node:path");
  const { existsSync } = require("node:fs");
  const pagesRoot = process.env.PAGES_ROOT!;
  
  // Create nested structure: Welcome/Markdown Guide/Child
  createPage("Welcome/Markdown Guide", "# Markdown Guide");
  createPage("Welcome/Markdown Guide/Child", "# Child");
  
  // Verify folder structure exists
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide/README.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide/Child.md"))).toBe(true);
  
  // Delete the child
  deletePage("Welcome/Markdown Guide/Child");
  
  // Verify parent is converted back to single file
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide/README.md"))).toBe(false);
  
  // Verify parent page still works
  const parent = readPage("Welcome/Markdown Guide");
  expect(parent).not.toBeNull();
  expect(parent?.content).toBe("# Markdown Guide");
});

test("defolderized page stays as single file after file operations", () => {
  const pagesRoot = process.env.PAGES_ROOT!;
  
  // Create parent and child (parent becomes folder)
  createPage("Parent", "# Parent");
  createPage("Parent/Child", "# Child");
  
  // Verify folder structure exists
  expect(existsSync(join(pagesRoot, "Parent/README.md"))).toBe(true);
  
  // Delete the child (defolderizes)
  deletePage("Parent/Child");
  
  // Verify it's now a single file
  expect(existsSync(join(pagesRoot, "Parent.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Parent/README.md"))).toBe(false);
  
  // Perform file operations that should NOT re-folderize
  // 1. List files (should return empty, not trigger folderization)
  const files = listFiles("Parent");
  expect(files).toEqual([]);
  
  // 2. Verify it's still a single file after listing files
  expect(existsSync(join(pagesRoot, "Parent.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Parent/README.md"))).toBe(false);
  
  // 3. Read the page again
  const parent = readPage("Parent");
  expect(parent).not.toBeNull();
  
  // 4. Verify it's still a single file after reading
  expect(existsSync(join(pagesRoot, "Parent.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Parent/README.md"))).toBe(false);
  
  // 5. Update the page
  updatePage("Parent", "# Updated Parent");
  
  // 6. Verify it's still a single file after updating
  expect(existsSync(join(pagesRoot, "Parent.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Parent/README.md"))).toBe(false);
});

test("defolderized page with spaces stays as single file after file operations", () => {
  const pagesRoot = process.env.PAGES_ROOT!;
  
  // Create parent with spaces and child
  createPage("Welcome/Markdown Guide", "# Markdown Guide");
  createPage("Welcome/Markdown Guide/Child", "# Child");
  
  // Verify folder structure exists
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide/README.md"))).toBe(true);
  
  // Delete the child (defolderizes)
  deletePage("Welcome/Markdown Guide/Child");
  
  // Verify it's now a single file
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide/README.md"))).toBe(false);
  
  // Perform file operations that should NOT re-folderize
  const files = listFiles("Welcome/Markdown Guide");
  expect(files).toEqual([]);
  
  // Verify it's still a single file after listing files
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide/README.md"))).toBe(false);
  
  // Read the page
  const page = readPage("Welcome/Markdown Guide");
  expect(page).not.toBeNull();
  
  // Verify it's still a single file after reading
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide.md"))).toBe(true);
  expect(existsSync(join(pagesRoot, "Welcome/Markdown Guide/README.md"))).toBe(false);
});

test("hidden pages have isHidden flag set to true", () => {
  createPage(".hidden-page", "# Hidden Content");
  createPage("visible-page", "# Visible Content");
  
  const hiddenPage = readPage(".hidden-page");
  const visiblePage = readPage("visible-page");
  
  expect(hiddenPage).not.toBeNull();
  expect(hiddenPage?.isHidden).toBe(true);
  expect(visiblePage).not.toBeNull();
  expect(visiblePage?.isHidden).toBe(false);
});

test("hidden folders have isHidden flag set to true", () => {
  // Create parent pages first, then create children to trigger folderization
  createPage(".hidden-folder", "# Hidden Folder");
  createPage(".hidden-folder/page", "# Content");
  createPage("visible-folder", "# Visible Folder");
  createPage("visible-folder/page", "# Content");
  
  const pages = listPages();
  const hiddenFolder = pages.find(p => p.path === ".hidden-folder");
  const visibleFolder = pages.find(p => p.path === "visible-folder");
  
  expect(hiddenFolder).toBeDefined();
  expect(hiddenFolder?.isHidden).toBe(true);
  expect(visibleFolder).toBeDefined();
  expect(visibleFolder?.isHidden).toBe(false);
});

test("listPages returns all pages including hidden ones", () => {
  createPage("visible-page", "# Visible");
  createPage(".hidden-page", "# Hidden");
  
  const pages = listPages();
  
  expect(pages.some(p => p.path === "visible-page")).toBe(true);
  expect(pages.some(p => p.path === ".hidden-page")).toBe(true);
});

test("non-markdown files have isMarkdown flag set to false", () => {
  const { writeFileSync } = require("node:fs");
  const pagesRoot = process.env.PAGES_ROOT!;
  
  // Create a non-markdown file
  writeFileSync(join(pagesRoot, "test-image.png"), "fake image data");
  
  const pages = listPages();
  const imageFile = pages.find(p => p.path === "test-image.png");
  
  expect(imageFile).toBeDefined();
  expect(imageFile?.isMarkdown).toBe(false);
  expect(imageFile?.content).toBe("");
});

test("markdown files have isMarkdown flag set to true", () => {
  createPage("test-page", "# Test Content");
  
  const page = readPage("test-page");
  
  expect(page).not.toBeNull();
  expect(page?.isMarkdown).toBe(true);
});

