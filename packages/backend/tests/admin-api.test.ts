import { afterEach, beforeEach, describe, expect, test } from "vitest";
import jwt from "jsonwebtoken";
import { buildServer } from "../src/mdz-server.js";
import { loadUsersConfig } from "../src/storage/user-access.js";
import { mintMagicToken } from "../src/auth/magic-link.js";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SECRET = "admin-api-secret";

let app: Awaited<ReturnType<typeof buildServer>>;
let testDir: string;

function createUsersYaml() {
  const settingsDir = join(testDir, ".settings");
  mkdirSync(settingsDir, { recursive: true });
  writeFileSync(
    join(settingsDir, "users.yaml"),
    `defaultAccess:
  read: [everyone]
  write: [writers]

users:
  admin@test.local:
    groups: [admins]
  writer@test.local:
    groups: [writers]
`
  );
}

function makeToken(email: string, groups: string[]): string {
  return jwt.sign({ email, name: "T", provider: "test", groups }, SECRET);
}

const adminAuth = () => ({ Authorization: `Bearer ${makeToken("admin@test.local", ["everyone", "admins"])}` });
const writerAuth = () => ({ Authorization: `Bearer ${makeToken("writer@test.local", ["everyone", "writers"])}` });

beforeEach(async () => {
  testDir = mkdtempSync(join(tmpdir(), "admin-api-test-"));
  process.env.PAGES_ROOT = testDir;
  process.env.NODE_ENV = "development";
  process.env.JWT_SECRET = SECRET;
  app = await buildServer();
  createUsersYaml();
});

afterEach(async () => {
  await app.close();
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
});

describe("admin guard", () => {
  test("rejects requests with no token (401)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/admin/users" });
    expect(res.statusCode).toBe(401);
  });

  test("rejects an invalid token (401)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/users",
      headers: { Authorization: "Bearer garbage" },
    });
    expect(res.statusCode).toBe(401);
  });

  test("hides the API from a non-admin member (404)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/users",
      headers: writerAuth(),
    });
    expect(res.statusCode).toBe(404);
  });

  test("rejects a magic-link-purpose token (401)", async () => {
    const magic = mintMagicToken("admin@test.local");
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/users",
      headers: { Authorization: `Bearer ${magic}` },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/admin/users", () => {
  test("admin lists members", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/users",
      headers: adminAuth(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { users: Record<string, { groups: string[] }> };
    expect(Object.keys(body.users).sort()).toEqual([
      "admin@test.local",
      "writer@test.local",
    ]);
  });
});

describe("POST /api/admin/users (addUser)", () => {
  test("adds a member and returns a working magic link", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      headers: { ...adminAuth(), "Content-Type": "application/json" },
      payload: { email: "alice@test.local", groups: ["writers"] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { email: string; groups: string[]; magicLinkUrl: string };
    expect(body.email).toBe("alice@test.local");
    expect(body.magicLinkUrl).toContain("/api/auth/magic?token=");

    // membership persisted
    expect(loadUsersConfig().users["alice@test.local"].groups).toEqual(["writers"]);

    // the returned link actually logs alice in
    const token = new URL(body.magicLinkUrl).searchParams.get("token")!;
    const login = await app.inject({
      method: "GET",
      url: `/api/auth/magic?token=${encodeURIComponent(token)}`,
    });
    expect(login.statusCode).toBe(302);
    expect((login.headers.location as string).startsWith("/auth/callback?token=")).toBe(true);
  });

  test("requires an email (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/users",
      headers: { ...adminAuth(), "Content-Type": "application/json" },
      payload: { groups: ["writers"] },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/admin/users/:email/magic-link (mintMagicLink)", () => {
  test("mints a fresh link for an existing member", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/users/writer@test.local/magic-link",
      headers: adminAuth(),
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { magicLinkUrl: string }).magicLinkUrl).toContain(
      "/api/auth/magic?token="
    );
  });

  test("returns 404 for a non-member", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/users/ghost@test.local/magic-link",
      headers: adminAuth(),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("PUT /api/admin/users/:email (setGroups)", () => {
  test("updates an existing member's groups", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/admin/users/writer@test.local",
      headers: { ...adminAuth(), "Content-Type": "application/json" },
      payload: { groups: ["team-a", "team-b"] },
    });
    expect(res.statusCode).toBe(200);
    expect(loadUsersConfig().users["writer@test.local"].groups).toEqual([
      "team-a",
      "team-b",
    ]);
  });

  test("returns 404 for a non-member", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/admin/users/ghost@test.local",
      headers: { ...adminAuth(), "Content-Type": "application/json" },
      payload: { groups: ["writers"] },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /api/admin/users/:email (removeUser)", () => {
  test("removes a member", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/admin/users/writer@test.local",
      headers: adminAuth(),
    });
    expect(res.statusCode).toBe(200);
    expect(loadUsersConfig().users["writer@test.local"]).toBeUndefined();
  });

  test("returns 404 for a non-member", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/admin/users/ghost@test.local",
      headers: adminAuth(),
    });
    expect(res.statusCode).toBe(404);
  });
});
