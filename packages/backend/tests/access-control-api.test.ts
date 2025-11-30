import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { buildServer } from "../src/server.js";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let app: Awaited<ReturnType<typeof buildServer>>;
let testDir: string;

function createUsersYaml(testDir: string) {
  const settingsDir = join(testDir, ".settings");
  mkdirSync(settingsDir, { recursive: true });

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
  team-a@test.local:
    groups: [team-a]
`;

  writeFileSync(join(settingsDir, "users.yaml"), usersYaml);
}

function generateTestJWT(email: string, groups: string[]): string {
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-in-production";
  const jwt = require("jsonwebtoken");
  return jwt.sign({ email, name: "Test User", provider: "test", groups }, jwtSecret);
}

beforeEach(async () => {
  testDir = mkdtempSync(join(tmpdir(), "access-api-test-"));
  process.env.PAGES_ROOT = testDir;
  process.env.NODE_ENV = "development";
  app = await buildServer();
  createUsersYaml(testDir);
});

afterEach(async () => {
  await app.close();
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
  delete process.env.NODE_ENV;
});

describe("API Access Control", () => {
  describe("Authentication", () => {
    test("returns 401 without auth token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/pages",
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "Unauthorized" });
    });

    test("returns 401 with invalid token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/pages",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "Invalid token" });
    });

    test("accepts valid token", async () => {
      const token = generateTestJWT("admin@test.local", ["everyone", "admins"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("List Pages Access", () => {
    test("admin sees all pages", async () => {
      writeFileSync(join(testDir, "Public.md"), "# Public");
      const restrictedContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Restricted`;
      writeFileSync(join(testDir, "Restricted.md"), restrictedContent);

      const token = generateTestJWT("admin@test.local", ["everyone", "admins"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const pages = response.json() as Array<{ path: string }>;
      expect(pages.some((p) => p.path === "Public")).toBe(true);
      expect(pages.some((p) => p.path === "Restricted")).toBe(true);
    });

    test("reader sees only public pages", async () => {
      writeFileSync(join(testDir, "Public.md"), "# Public");
      const restrictedContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Restricted`;
      writeFileSync(join(testDir, "Restricted.md"), restrictedContent);

      const token = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const pages = response.json() as Array<{ path: string }>;
      expect(pages.some((p) => p.path === "Public")).toBe(true);
      expect(pages.some((p) => p.path === "Restricted")).toBe(false);
    });

    test("team member sees team pages", async () => {
      writeFileSync(join(testDir, "Public.md"), "# Public");
      const teamContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Team A`;
      writeFileSync(join(testDir, "TeamPage.md"), teamContent);

      const token = generateTestJWT("team-a@test.local", ["everyone", "team-a"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const pages = response.json() as Array<{ path: string }>;
      expect(pages.some((p) => p.path === "Public")).toBe(true);
      expect(pages.some((p) => p.path === "TeamPage")).toBe(true);
    });

    test("user not in users.yaml sees nothing", async () => {
      writeFileSync(join(testDir, "Public.md"), "# Public");

      const token = generateTestJWT("unknown@test.local", []);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const pages = response.json() as Array<{ path: string }>;
      expect(pages.length).toBe(0);
    });
  });

  describe("Read Page Access", () => {
    test("admin can read restricted page", async () => {
      const content = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Restricted`;
      writeFileSync(join(testDir, "Restricted.md"), content);

      const token = generateTestJWT("admin@test.local", ["everyone", "admins"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages/Restricted",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const page = response.json() as { path: string };
      expect(page.path).toBe("Restricted");
    });

    test("reader gets 404 for restricted page", async () => {
      const content = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Restricted`;
      writeFileSync(join(testDir, "Restricted.md"), content);

      const token = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages/Restricted",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    test("team member can read team page", async () => {
      const content = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Team A`;
      writeFileSync(join(testDir, "TeamPage.md"), content);

      const token = generateTestJWT("team-a@test.local", ["everyone", "team-a"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages/TeamPage",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("Write Page Access", () => {
    test("writer can update public page", async () => {
      writeFileSync(join(testDir, "Public.md"), "# Original");

      const token = generateTestJWT("writer@test.local", ["everyone", "writers"]);

      const response = await app.inject({
        method: "PUT",
        url: "/api/pages/Public",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          content: "# Updated",
        },
      });

      expect(response.statusCode).toBe(200);
    });

    test("reader cannot update page", async () => {
      writeFileSync(join(testDir, "Public.md"), "# Original");

      const token = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "PUT",
        url: "/api/pages/Public",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          content: "# Updated",
        },
      });

      expect(response.statusCode).toBe(404);
    });

    test("writer cannot update restricted page", async () => {
      const content = `---
__access:
  read: [admins]
  write: [admins]
---
# Admin Only`;
      writeFileSync(join(testDir, "AdminPage.md"), content);

      const token = generateTestJWT("writer@test.local", ["everyone", "writers"]);

      const response = await app.inject({
        method: "PUT",
        url: "/api/pages/AdminPage",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          content: "# Updated",
        },
      });

      expect(response.statusCode).toBe(404);
    });

    test("admin can update any page", async () => {
      const content = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Team A`;
      writeFileSync(join(testDir, "TeamPage.md"), content);

      const token = generateTestJWT("admin@test.local", ["everyone", "admins"]);

      const response = await app.inject({
        method: "PUT",
        url: "/api/pages/TeamPage",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          content: "# Admin Updated",
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("Create Page Access", () => {
    test("writer can create page at root", async () => {
      const token = generateTestJWT("writer@test.local", ["everyone", "writers"]);

      const response = await app.inject({
        method: "POST",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          path: "NewPage",
          content: "# New",
        },
      });

      expect(response.statusCode).toBe(200);
    });

    test("reader cannot create page", async () => {
      const token = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "POST",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          path: "NewPage",
          content: "# New",
        },
      });

      expect(response.statusCode).toBe(404);
    });

    test("cannot create child under restricted parent", async () => {
      const content = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Team A`;
      writeFileSync(join(testDir, "TeamPage.md"), content);

      const token = generateTestJWT("writer@test.local", ["everyone", "writers"]);

      const response = await app.inject({
        method: "POST",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          path: "Child",
          parent: "TeamPage",
          content: "# Child",
        },
      });

      expect(response.statusCode).toBe(404);
    });

    test("can create child under accessible parent", async () => {
      writeFileSync(join(testDir, "Parent.md"), "# Parent");

      const token = generateTestJWT("writer@test.local", ["everyone", "writers"]);

      const response = await app.inject({
        method: "POST",
        url: "/api/pages",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          path: "Child",
          parent: "Parent",
          content: "# Child",
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("Delete Page Access", () => {
    test("writer can delete public page", async () => {
      writeFileSync(join(testDir, "ToDelete.md"), "# Delete Me");

      const token = generateTestJWT("writer@test.local", ["everyone", "writers"]);

      const response = await app.inject({
        method: "DELETE",
        url: "/api/pages/ToDelete",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    test("reader cannot delete page", async () => {
      writeFileSync(join(testDir, "ToDelete.md"), "# Delete Me");

      const token = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "DELETE",
        url: "/api/pages/ToDelete",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("Rename Page Access", () => {
    test("writer can rename public page", async () => {
      writeFileSync(join(testDir, "OldName.md"), "# Content");

      const token = generateTestJWT("writer@test.local", ["everyone", "writers"]);

      const response = await app.inject({
        method: "PATCH",
        url: "/api/pages/OldName",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          newPath: "NewName",
        },
      });

      expect(response.statusCode).toBe(200);
    });

    test("reader cannot rename page", async () => {
      writeFileSync(join(testDir, "OldName.md"), "# Content");

      const token = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "PATCH",
        url: "/api/pages/OldName",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        payload: {
          newPath: "NewName",
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("File Access Control", () => {
    test("admin can list files from restricted page", async () => {
      const pageDir = join(testDir, "RestrictedPage");
      mkdirSync(pageDir, { recursive: true });

      const pageContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Restricted`;
      writeFileSync(join(pageDir, "README.md"), pageContent);
      writeFileSync(join(pageDir, "file.txt"), "content");

      const token = generateTestJWT("admin@test.local", ["everyone", "admins"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/files/RestrictedPage",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    test("reader cannot list files from restricted page", async () => {
      const pageDir = join(testDir, "RestrictedPage");
      mkdirSync(pageDir, { recursive: true });

      const pageContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Restricted`;
      writeFileSync(join(pageDir, "README.md"), pageContent);
      writeFileSync(join(pageDir, "file.txt"), "content");

      const token = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/files/RestrictedPage",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    test("reader cannot download file from restricted page", async () => {
      const pageDir = join(testDir, "RestrictedPage");
      mkdirSync(pageDir, { recursive: true });

      const pageContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Restricted`;
      writeFileSync(join(pageDir, "README.md"), pageContent);
      writeFileSync(join(pageDir, "file.txt"), "content");

      const token = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/files/RestrictedPage/file.txt",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });

    test("writer cannot upload to restricted page", async () => {
      const pageDir = join(testDir, "RestrictedPage");
      mkdirSync(pageDir, { recursive: true });

      const pageContent = `---
__access:
  read: [admins]
  write: [admins]
---
# Admin Only`;
      writeFileSync(join(pageDir, "README.md"), pageContent);

      const token = generateTestJWT("writer@test.local", ["everyone", "writers"]);

      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const fileContent = "test file content";
      const multipartPayload = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.txt"',
        "Content-Type: text/plain",
        "",
        fileContent,
        `--${boundary}--`,
      ].join("\r\n");

      const response = await app.inject({
        method: "POST",
        url: "/api/files/RestrictedPage",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": `multipart/form-data; boundary=${boundary}`,
        },
        payload: multipartPayload,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("Access Inheritance", () => {
    test("child inherits parent read access", async () => {
      const parentContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Parent`;

      writeFileSync(join(testDir, "Parent.md"), parentContent);

      const parentDir = join(testDir, "Parent");
      mkdirSync(parentDir, { recursive: true });
      writeFileSync(join(parentDir, "README.md"), parentContent);
      writeFileSync(join(parentDir, "Child.md"), "# Child");

      const readerToken = generateTestJWT("reader@test.local", ["everyone"]);

      const response = await app.inject({
        method: "GET",
        url: "/api/pages/Parent/Child",
        headers: {
          Authorization: `Bearer ${readerToken}`,
        },
      });

      expect(response.statusCode).toBe(404);

      const teamToken = generateTestJWT("team-a@test.local", ["everyone", "team-a"]);

      const response2 = await app.inject({
        method: "GET",
        url: "/api/pages/Parent/Child",
        headers: {
          Authorization: `Bearer ${teamToken}`,
        },
      });

      expect(response2.statusCode).toBe(200);
    });
  });
});
