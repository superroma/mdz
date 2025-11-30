import { afterEach, beforeEach, expect, test } from "vitest";
import { buildServer } from "../src/server";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let app: Awaited<ReturnType<typeof buildServer>>;
let testDir: string;

beforeEach(async () => {
  testDir = mkdtempSync(join(tmpdir(), "server-test-"));
  process.env.PAGES_ROOT = testDir;
  app = await buildServer();
});

afterEach(async () => {
  await app.close();
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
});

test("health endpoint returns ok status", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/api/health"
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({
    status: "ok",
    pagesRoot: testDir
  });
});

test("list pages with hierarchy", async () => {
  // Create seed pages
  writeFileSync(join(testDir, "Page1.md"), "# Page 1\nContent");
  writeFileSync(join(testDir, "Page2.md"), "# Page 2\nContent");
  mkdirSync(join(testDir, "Parent"));
  writeFileSync(join(testDir, "Parent", "README.md"), "# Parent\nContent");
  writeFileSync(join(testDir, "Parent", "Child.md"), "# Child\nContent");

  const response = await app.inject({
    method: "GET",
    url: "/api/pages"
  });

  expect(response.statusCode).toBe(200);
  const pages = response.json() as Array<{ path: string; children: string[]; parent?: string }>;
  expect(pages.length).toBeGreaterThanOrEqual(4);
  expect(pages.some((p) => p.path === "Page1")).toBe(true);
  expect(pages.some((p) => p.path === "Page2")).toBe(true);
  expect(pages.some((p) => p.path === "Parent")).toBe(true);
  expect(pages.some((p) => p.path === "Parent/Child")).toBe(true);
  
  const parent = pages.find((p) => p.path === "Parent");
  expect(parent?.children).toContain("Parent/Child");
  
  const child = pages.find((p) => p.path === "Parent/Child");
  expect(child?.parent).toBe("Parent");
});

test("read page with front-matter", async () => {
  const content = `---
status: Draft
author: Test User
---
# Test Page
Content here`;
  writeFileSync(join(testDir, "TestPage.md"), content);

  const response = await app.inject({
    method: "GET",
    url: "/api/pages/TestPage"
  });

  expect(response.statusCode).toBe(200);
  const page = response.json() as { path: string; content: string; frontMatter: Record<string, unknown> };
  expect(page.path).toBe("TestPage");
  expect(page.content.trim()).toBe("# Test Page\nContent here");
  expect(page.frontMatter.status).toBe("Draft");
  expect(page.frontMatter.author).toBe("Test User");
});

test("create root page", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/api/pages",
    payload: {
      path: "NewPage",
      content: "# New Page\nContent"
    }
  });

  expect(response.statusCode).toBe(200);
  const page = response.json() as { path: string; content: string };
  expect(page.path).toBe("NewPage");
  expect(page.content).toBe("# New Page\nContent");
});

test("create child page triggers folderization", async () => {
  // Create parent as single file
  writeFileSync(join(testDir, "Parent.md"), "# Parent\nContent");

  const response = await app.inject({
    method: "POST",
    url: "/api/pages",
    payload: {
      path: "Child",
      parent: "Parent",
      content: "# Child\nContent"
    }
  });

  expect(response.statusCode).toBe(200);
  const page = response.json() as { path: string };
  expect(page.path).toBe("Parent/Child");
  
  // Verify folderization occurred
  const { existsSync } = await import("node:fs");
  expect(existsSync(join(testDir, "Parent", "README.md"))).toBe(true);
  expect(existsSync(join(testDir, "Parent", "Child.md"))).toBe(true);
});

test("update page content", async () => {
  writeFileSync(join(testDir, "TestPage.md"), "# Original\nContent");

  const response = await app.inject({
    method: "PUT",
    url: "/api/pages/TestPage",
    payload: {
      content: "# Updated\nNew content"
    }
  });

  expect(response.statusCode).toBe(200);
  const page = response.json() as { content: string };
  expect(page.content).toBe("# Updated\nNew content");
});

test("rename page", async () => {
  writeFileSync(join(testDir, "OldName.md"), "# Content");

  const response = await app.inject({
    method: "PATCH",
    url: "/api/pages/OldName",
    payload: {
      newPath: "NewName"
    }
  });

  expect(response.statusCode).toBe(200);
  const page = response.json() as { path: string };
  expect(page.path).toBe("NewName");
  
  // Verify old page doesn't exist
  const getResponse = await app.inject({
    method: "GET",
    url: "/api/pages/OldName"
  });
  expect(getResponse.statusCode).toBe(404);
});

test("delete page", async () => {
  writeFileSync(join(testDir, "ToDelete.md"), "# Content");

  const response = await app.inject({
    method: "DELETE",
    url: "/api/pages/ToDelete"
  });

  expect(response.statusCode).toBe(200);
  
  // Verify page is deleted
  const getResponse = await app.inject({
    method: "GET",
    url: "/api/pages/ToDelete"
  });
  expect(getResponse.statusCode).toBe(404);
});

test("path traversal prevention returns 403", async () => {
  // Test path traversal with encoded dots
  const response1 = await app.inject({
    method: "GET",
    url: "/api/pages/%2E%2E%2F%2E%2E%2F%2E%2E%2Fetc%2Fpasswd"
  });
  expect(response1.statusCode).toBe(403);
  expect(response1.json()).toHaveProperty("error");

  // Test with double-encoded path traversal
  const response2 = await app.inject({
    method: "GET",
    url: "/api/pages/%252E%252E%252F%252E%252E%252Fetc%252Fpasswd"
  });
  // Could be 403 or 404 depending on normalization
  expect([403, 404]).toContain(response2.statusCode);
});

test("file upload", async () => {
  writeFileSync(join(testDir, "TestPage.md"), "# Test Page\nContent");

  // Create multipart form data manually
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const fileContent = "test file content";
  const multipartPayload = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="test.txt"',
    "Content-Type: text/plain",
    "",
    fileContent,
    `--${boundary}--`
  ].join("\r\n");

  const response = await app.inject({
    method: "POST",
    url: "/api/files/TestPage",
    payload: multipartPayload,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`
    }
  });

  expect(response.statusCode).toBe(201);
  const file = response.json() as { name: string; size: number };
  expect(file.name).toBe("test.txt");
  expect(file.size).toBeGreaterThan(0);
});

test("file download", async () => {
  mkdirSync(join(testDir, "TestPage"), { recursive: true });
  writeFileSync(join(testDir, "TestPage", "README.md"), "# Test Page");
  writeFileSync(join(testDir, "TestPage", "test.txt"), "file content");

  const response = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/test.txt"
  });

  expect(response.statusCode).toBe(200);
  expect(response.body.toString()).toBe("file content");
});

test("files are served with correct MIME type and inline disposition", async () => {
  mkdirSync(join(testDir, "TestPage"), { recursive: true });
  writeFileSync(join(testDir, "TestPage", "README.md"), "# Test Page");
  writeFileSync(join(testDir, "TestPage", "test.txt"), "file content");
  writeFileSync(join(testDir, "TestPage", "image.png"), "fake image data");
  writeFileSync(join(testDir, "TestPage", "document.pdf"), "fake pdf data");

  // Test text file
  const txtResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/test.txt"
  });
  expect(txtResponse.statusCode).toBe(200);
  expect(txtResponse.headers["content-type"]).toBe("text/plain");
  expect(txtResponse.headers["content-disposition"]).toBe('inline; filename="test.txt"');

  // Test image file
  const imgResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/image.png"
  });
  expect(imgResponse.statusCode).toBe(200);
  expect(imgResponse.headers["content-type"]).toBe("image/png");
  expect(imgResponse.headers["content-disposition"]).toBe('inline; filename="image.png"');

  // Test PDF file
  const pdfResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/document.pdf"
  });
  expect(pdfResponse.statusCode).toBe(200);
  expect(pdfResponse.headers["content-type"]).toBe("application/pdf");
  expect(pdfResponse.headers["content-disposition"]).toBe('inline; filename="document.pdf"');
});

test("office file formats are allowed and served with correct MIME types", async () => {
  mkdirSync(join(testDir, "TestPage"), { recursive: true });
  writeFileSync(join(testDir, "TestPage", "README.md"), "# Test Page");
  writeFileSync(join(testDir, "TestPage", "document.docx"), "fake docx content");
  writeFileSync(join(testDir, "TestPage", "spreadsheet.xlsx"), "fake xlsx content");
  writeFileSync(join(testDir, "TestPage", "presentation.pptx"), "fake pptx content");
  writeFileSync(join(testDir, "TestPage", "document.odt"), "fake odt content");
  writeFileSync(join(testDir, "TestPage", "data.csv"), "fake csv content");

  // Test Microsoft Office formats
  const docxResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/document.docx"
  });
  expect(docxResponse.statusCode).toBe(200);
  expect(docxResponse.headers["content-type"]).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  expect(docxResponse.headers["content-disposition"]).toBe('inline; filename="document.docx"');

  const xlsxResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/spreadsheet.xlsx"
  });
  expect(xlsxResponse.statusCode).toBe(200);
  expect(xlsxResponse.headers["content-type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  expect(xlsxResponse.headers["content-disposition"]).toBe('inline; filename="spreadsheet.xlsx"');

  const pptxResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/presentation.pptx"
  });
  expect(pptxResponse.statusCode).toBe(200);
  expect(pptxResponse.headers["content-type"]).toBe("application/vnd.openxmlformats-officedocument.presentationml.presentation");
  expect(pptxResponse.headers["content-disposition"]).toBe('inline; filename="presentation.pptx"');

  // Test OpenDocument formats
  const odtResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/document.odt"
  });
  expect(odtResponse.statusCode).toBe(200);
  expect(odtResponse.headers["content-type"]).toBe("application/vnd.oasis.opendocument.text");
  expect(odtResponse.headers["content-disposition"]).toBe('inline; filename="document.odt"');

  // Test CSV
  const csvResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/data.csv"
  });
  expect(csvResponse.statusCode).toBe(200);
  expect(csvResponse.headers["content-type"]).toBe("text/csv");
  expect(csvResponse.headers["content-disposition"]).toBe('inline; filename="data.csv"');
});

test("files with disallowed extensions are rejected", async () => {
  mkdirSync(join(testDir, "TestPage"), { recursive: true });
  writeFileSync(join(testDir, "TestPage", "README.md"), "# Test Page");

  // Test dangerous file types are rejected
  const dangerousFiles = [
    "malicious.exe",
    "script.sh",
    "virus.bat",
    "malware.js",
    "trojan.py",
    "exploit.php",
    "macro.docm",
    "app.dmg",
    "installer.msi",
  ];

  for (const filename of dangerousFiles) {
    const response = await app.inject({
      method: "GET",
      url: `/api/files/TestPage/${filename}`
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error");
    expect((response.json() as { error: string }).error).toContain("not allowed");
  }
});

test("file upload rejects dangerous file types", async () => {
  writeFileSync(join(testDir, "TestPage.md"), "# Test Page\nContent");

  const dangerousFiles = [
    "malicious.exe",
    "script.sh",
    "virus.bat",
    "malware.js",
    "trojan.py",
  ];

  for (const filename of dangerousFiles) {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const fileContent = "dangerous content";
    const multipartPayload = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${filename}"`,
      "Content-Type: application/octet-stream",
      "",
      fileContent,
      `--${boundary}--`
    ].join("\r\n");

    const response = await app.inject({
      method: "POST",
      url: "/api/files/TestPage",
      payload: multipartPayload,
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error");
    expect((response.json() as { error: string }).error).toContain("not allowed");
  }
});

test("file upload rejects files without extensions", async () => {
  writeFileSync(join(testDir, "TestPage.md"), "# Test Page\nContent");

  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const fileContent = "file without extension";
  const multipartPayload = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="noextension"',
    "Content-Type: application/octet-stream",
    "",
    fileContent,
    `--${boundary}--`
  ].join("\r\n");

  const response = await app.inject({
    method: "POST",
    url: "/api/files/TestPage",
    payload: multipartPayload,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`
    }
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toHaveProperty("error");
  expect((response.json() as { error: string }).error).toContain("extension");
});

test("file deletion", async () => {
  mkdirSync(join(testDir, "TestPage"), { recursive: true });
  writeFileSync(join(testDir, "TestPage", "README.md"), "# Test Page");
  writeFileSync(join(testDir, "TestPage", "test.txt"), "file content");

  const response = await app.inject({
    method: "DELETE",
    url: "/api/files/TestPage/test.txt"
  });

  expect(response.statusCode).toBe(200);
  
  // Verify file is deleted
  const getResponse = await app.inject({
    method: "GET",
    url: "/api/files/TestPage/test.txt"
  });
  expect(getResponse.statusCode).toBe(404);
});

test("list files for single-segment page path", async () => {
  // Create a page directory with a file (like Welcome/logo.png)
  mkdirSync(join(testDir, "Welcome"), { recursive: true });
  writeFileSync(join(testDir, "Welcome", "README.md"), "# Welcome\n![Logo](./logo.png)");
  writeFileSync(join(testDir, "Welcome", "logo.png"), "fake image data");

  const response = await app.inject({
    method: "GET",
    url: "/api/files/Welcome"
  });

  expect(response.statusCode).toBe(200);
  const result = response.json() as { files: Array<{ name: string; size: number }> };
  expect(result.files).toBeDefined();
  expect(Array.isArray(result.files)).toBe(true);
  const logoFile = result.files.find((f) => f.name === "logo.png");
  expect(logoFile).toBeDefined();
  expect(logoFile?.size).toBeGreaterThan(0);
});

test("list files for multi-segment page path", async () => {
  // Create a nested page directory with a file
  mkdirSync(join(testDir, "Welcome", "Tasks"), { recursive: true });
  writeFileSync(join(testDir, "Welcome", "Tasks", "README.md"), "# Tasks");
  writeFileSync(join(testDir, "Welcome", "Tasks", "attachment.pdf"), "fake pdf data");

  const response = await app.inject({
    method: "GET",
    url: "/api/files/Welcome/Tasks"
  });

  expect(response.statusCode).toBe(200);
  const result = response.json() as { files: Array<{ name: string; size: number }> };
  expect(result.files).toBeDefined();
  expect(Array.isArray(result.files)).toBe(true);
  const pdfFile = result.files.find((f) => f.name === "attachment.pdf");
  expect(pdfFile).toBeDefined();
  expect(pdfFile?.size).toBeGreaterThan(0);
});

test("list files excludes hidden files", async () => {
  // Create a page directory with both visible and hidden files
  mkdirSync(join(testDir, "TestPage"), { recursive: true });
  writeFileSync(join(testDir, "TestPage", "README.md"), "# Test");
  writeFileSync(join(testDir, "TestPage", "document.pdf"), "visible file");
  writeFileSync(join(testDir, "TestPage", ".DS_Store"), "hidden file");
  writeFileSync(join(testDir, "TestPage", ".hidden"), "another hidden file");

  const response = await app.inject({
    method: "GET",
    url: "/api/files/TestPage"
  });

  expect(response.statusCode).toBe(200);
  const result = response.json() as { files: Array<{ name: string; size: number }> };
  expect(result.files).toBeDefined();
  expect(Array.isArray(result.files)).toBe(true);
  
  // Should include visible file
  const visibleFile = result.files.find((f) => f.name === "document.pdf");
  expect(visibleFile).toBeDefined();
  
  // Should exclude hidden files
  const dsStore = result.files.find((f) => f.name === ".DS_Store");
  const hiddenFile = result.files.find((f) => f.name === ".hidden");
  expect(dsStore).toBeUndefined();
  expect(hiddenFile).toBeUndefined();
  
  // Should only have 1 file (the visible one)
  expect(result.files.length).toBe(1);
});

test("not found error returns 404", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/api/pages/NonExistent"
  });

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ error: "Page not found" });
});

test("validation error returns 400", async () => {
  const response = await app.inject({
    method: "PUT",
    url: "/api/pages/TestPage",
    payload: {}
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toHaveProperty("error");
});

