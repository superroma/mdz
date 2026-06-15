import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { buildServer } from "../../src/mdz-server.js";
import { mintMagicToken } from "../../src/auth/magic-link.js";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SECRET = "session-hardening-secret";

let app: Awaited<ReturnType<typeof buildServer>>;
let testDir: string;

beforeEach(async () => {
  testDir = mkdtempSync(join(tmpdir(), "session-hardening-test-"));
  process.env.PAGES_ROOT = testDir;
  process.env.NODE_ENV = "development";
  process.env.JWT_SECRET = SECRET;
  app = await buildServer();

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
`
  );
});

afterEach(async () => {
  await app.close();
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
});

describe("session hook rejects magic-link bootstrap tokens", () => {
  test("a magic-link token used as a Bearer on /api/pages is rejected (401)", async () => {
    const magic = mintMagicToken("admin@test.local");

    const res = await app.inject({
      method: "GET",
      url: "/api/pages",
      headers: { Authorization: `Bearer ${magic}` },
    });

    expect(res.statusCode).toBe(401);
  });

  test("a magic-link token in the auth_token cookie on /api/pages is rejected (401)", async () => {
    const magic = mintMagicToken("admin@test.local");

    const res = await app.inject({
      method: "GET",
      url: "/api/pages",
      cookies: { auth_token: magic },
    });

    expect(res.statusCode).toBe(401);
  });
});
