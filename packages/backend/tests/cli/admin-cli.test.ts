import { afterEach, beforeEach, describe, expect, it, test } from "vitest";
import jwt from "jsonwebtoken";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runAdminCommand } from "../../src/cli/admin.js";
import { loadUsersConfig } from "../../src/storage/user-access.js";

let testDir: string;

function seed() {
  const settingsDir = join(testDir, ".settings");
  mkdirSync(settingsDir, { recursive: true });
  writeFileSync(
    join(settingsDir, "users.yaml"),
    `defaultAccess:
  read: [everyone]
  write: [writers]

users:
  writer@test.local:
    groups: [writers]
`
  );
}

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "admin-cli-test-"));
  process.env.PAGES_ROOT = testDir;
  process.env.JWT_SECRET = "cli-secret";
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
  delete process.env.JWT_SECRET;
  delete process.env.BACKEND_URL;
});

describe("runAdminCommand", () => {
  test("add-user creates a member and prints a magic link", async () => {
    seed();
    const out = await runAdminCommand([
      "add-user",
      "alice@test.local",
      "writers",
      "team-a",
    ]);
    expect(out).toContain("/api/auth/magic?token=");
    expect(loadUsersConfig().users["alice@test.local"].groups).toEqual([
      "writers",
      "team-a",
    ]);
  });

  test("list prints existing members", async () => {
    seed();
    const out = await runAdminCommand(["list"]);
    expect(out).toContain("writer@test.local");
  });

  test("set-groups updates an existing member", async () => {
    seed();
    await runAdminCommand(["set-groups", "writer@test.local", "team-b"]);
    expect(loadUsersConfig().users["writer@test.local"].groups).toEqual([
      "team-b",
    ]);
  });

  test("set-groups rejects an unknown member", async () => {
    seed();
    await expect(
      runAdminCommand(["set-groups", "ghost@test.local", "writers"])
    ).rejects.toThrow();
  });

  test("remove deletes a member", async () => {
    seed();
    await runAdminCommand(["remove", "writer@test.local"]);
    expect(loadUsersConfig().users["writer@test.local"]).toBeUndefined();
  });

  test("mint-link returns a link for a member", async () => {
    seed();
    const out = await runAdminCommand(["mint-link", "writer@test.local"]);
    expect(out).toContain("/api/auth/magic?token=");
  });

  test("mint-link rejects an unknown member", async () => {
    seed();
    await expect(
      runAdminCommand(["mint-link", "ghost@test.local"])
    ).rejects.toThrow();
  });

  test("an unknown command throws", async () => {
    await expect(runAdminCommand(["frobnicate"])).rejects.toThrow();
  });
});

describe("admin cli: mint-admin-token", () => {
  const OLD = process.env;
  beforeEach(() => { process.env = { ...OLD, JWT_SECRET: "test-secret" }; });
  afterEach(() => { process.env = OLD; });

  it("prints a verifiable admins token", async () => {
    const out = await runAdminCommand(["mint-admin-token", "agent-admin@demo.example.com"]);
    const decoded = jwt.verify(out.trim(), "test-secret") as any;
    expect(decoded.groups).toContain("admins");
    expect(decoded.purpose).toBeUndefined();
  });

  it("requires an email", async () => {
    await expect(runAdminCommand(["mint-admin-token"])).rejects.toThrow(/usage: mint-admin-token/);
  });
});
