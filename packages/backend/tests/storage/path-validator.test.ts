import { afterEach, beforeEach, expect, test } from "vitest";
import { validatePath, validateFilename, getPagesRoot } from "../../src/storage/path-validator";
import { getPageTitleFromPath } from "../../src/storage/folderization";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let testDir: string;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pages-test-"));
  process.env.PAGES_ROOT = testDir;
});

afterEach(() => {
  delete process.env.PAGES_ROOT;
});

test("validatePath allows valid relative paths", () => {
  const result = validatePath("test/page");
  expect(result.valid).toBe(true);
  expect(result.resolvedPath).toContain("test/page");
});

test("validatePath blocks path traversal with ..", () => {
  const result = validatePath("../../etc/passwd");
  expect(result.valid).toBe(false);
  expect(result.error).toContain("Path traversal");
});

test("validatePath blocks absolute paths outside root", () => {
  const result = validatePath("/etc/passwd");
  expect(result.valid).toBe(false);
});

test("validateFilename allows valid filenames", () => {
  const result = validateFilename("test.png");
  expect(result.valid).toBe(true);
});

test("validateFilename blocks filenames with path separators", () => {
  const result = validateFilename("test/file.png");
  expect(result.valid).toBe(false);
  expect(result.error).toContain("path separators");
});

test("validateFilename blocks filenames with ..", () => {
  const result = validateFilename("../../test.png");
  expect(result.valid).toBe(false);
  expect(result.error).toContain("..");
});

test("validatePath blocks mixed traversal attempts", () => {
  const result = validatePath("valid/../../../etc/passwd");
  expect(result.valid).toBe(false);
  expect(result.error).toContain("Path traversal");
});

test("validatePath handles Unicode characters in paths", () => {
  const result = validatePath("测试/页面");
  expect(result.valid).toBe(true);
  expect(result.resolvedPath).toContain("测试");
});

test("validatePath handles empty path segments", () => {
  const result = validatePath("test//page");
  expect(result.valid).toBe(true);
  // Normalized path should handle empty segments
});

test("validateFilename handles special characters", () => {
  const result = validateFilename("test-file_123.png");
  expect(result.valid).toBe(true);
});

test("validateFilename blocks empty filename", () => {
  const result = validateFilename("");
  expect(result.valid).toBe(false);
  expect(result.error).toContain("empty");
});

test("validateFilename blocks whitespace-only filename", () => {
  const result = validateFilename("   ");
  expect(result.valid).toBe(false);
  expect(result.error).toContain("empty");
});

test("getPageTitleFromPath extracts title from simple path", () => {
  const title = getPageTitleFromPath("MyPage");
  expect(title).toBe("MyPage");
});

test("getPageTitleFromPath extracts title from nested path", () => {
  const title = getPageTitleFromPath("Parent/Child");
  expect(title).toBe("Child");
});

test("getPageTitleFromPath handles README paths", () => {
  const title = getPageTitleFromPath("Parent/README");
  expect(title).toBe("Parent");
});

test("getPageTitleFromPath handles root README", () => {
  const title = getPageTitleFromPath("README");
  expect(title).toBe("README");
});

test("validatePath handles paths with .md extension", () => {
  const result = validatePath("test/page.md");
  expect(result.valid).toBe(true);
});

test("validatePath blocks absolute paths outside root", () => {
  const absolutePath = join("/", "etc", "passwd");
  const result = validatePath(absolutePath);
  expect(result.valid).toBe(false);
});

