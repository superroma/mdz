import { afterEach, beforeEach, expect, test } from "vitest";
import { validatePath, validateFilename, getPagesRoot } from "../../src/storage/path-validator";
import { getPageTitleFromPath } from "../../src/storage/folderization";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, isAbsolute } from "node:path";
import { tmpdir } from "node:os";

let testDir: string;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pages-test-"));
  process.env.PAGES_ROOT = testDir;
});

afterEach(() => {
  if (testDir) {
    rmSync(testDir, { recursive: true, force: true });
  }
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

test("validatePath resolves paths with spaces correctly", () => {
  const result = validatePath("Welcome/Markdown Guide");
  expect(result.valid).toBe(true);
  expect(result.resolvedPath).toBe(join(testDir, "Welcome", "Markdown Guide"));
});

test("validatePath resolves nested paths with spaces correctly", () => {
  const result = validatePath("Welcome/Markdown Guide/Child Page");
  expect(result.valid).toBe(true);
  expect(result.resolvedPath).toBe(join(testDir, "Welcome", "Markdown Guide", "Child Page"));
});

test("validatePath resolved path matches actual filesystem path", () => {
  const pathWithSpaces = "Parent/Child Page";
  const result = validatePath(pathWithSpaces);
  
  expect(result.valid).toBe(true);
  const resolvedPath = result.resolvedPath;
  
  // Create the directory structure
  mkdirSync(resolvedPath, { recursive: true });
  writeFileSync(join(resolvedPath, "test.md"), "# Test");
  
  // Verify the resolved path actually exists
  expect(existsSync(resolvedPath)).toBe(true);
  expect(existsSync(join(resolvedPath, "test.md"))).toBe(true);
});

test("validatePath resolves paths consistently - same input gives same output", () => {
  const path = "Welcome/Markdown Guide";
  const result1 = validatePath(path);
  const result2 = validatePath(path);
  
  expect(result1.valid).toBe(true);
  expect(result2.valid).toBe(true);
  expect(result1.resolvedPath).toBe(result2.resolvedPath);
});

test("validatePath handles paths with multiple spaces", () => {
  const result = validatePath("Parent/Child Page With Multiple Spaces");
  expect(result.valid).toBe(true);
  expect(result.resolvedPath).toBe(join(testDir, "Parent", "Child Page With Multiple Spaces"));
});

test("validatePath resolves single file path correctly", () => {
  const path = "Page With Spaces";
  const result = validatePath(path);
  
  expect(result.valid).toBe(true);
  const resolvedPath = result.resolvedPath;
  const filePath = `${resolvedPath}.md`;
  
  // Create the file
  writeFileSync(filePath, "# Test");
  
  // Verify the resolved path leads to the actual file
  expect(existsSync(filePath)).toBe(true);
});

test("validatePath resolves paths with special characters", () => {
  const result = validatePath("Parent/Page-With_Dots.and.more");
  expect(result.valid).toBe(true);
  expect(result.resolvedPath).toBe(join(testDir, "Parent", "Page-With_Dots.and.more"));
});

test("validatePath resolved path is absolute and within pages root", () => {
  const result = validatePath("Test/Page");
  expect(result.valid).toBe(true);
  
  // Resolved path should be absolute
  expect(isAbsolute(result.resolvedPath)).toBe(true);
  
  // Resolved path should start with testDir (pages root)
  expect(result.resolvedPath.startsWith(testDir)).toBe(true);
});

test("validatePath handles root level paths", () => {
  const result = validatePath("RootPage");
  expect(result.valid).toBe(true);
  expect(result.resolvedPath).toBe(join(testDir, "RootPage"));
});

test("validatePath handles deeply nested paths with spaces", () => {
  const result = validatePath("Level1/Level 2/Level 3/Level 4");
  expect(result.valid).toBe(true);
  expect(result.resolvedPath).toBe(join(testDir, "Level1", "Level 2", "Level 3", "Level 4"));
});

