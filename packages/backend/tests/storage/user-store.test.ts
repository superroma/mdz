import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadUsersConfig,
  calculateUserGroups,
  upsertUser,
  removeUser,
  listUsers,
} from "../../src/storage/user-access.js";

let testDir: string;

function seedUsersYaml() {
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

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "user-store-test-"));
  process.env.PAGES_ROOT = testDir;
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
});

describe("upsertUser", () => {
  test("adds a new user and persists to users.yaml", () => {
    seedUsersYaml();
    upsertUser("alice@test.local", ["writers"]);
    expect(loadUsersConfig().users["alice@test.local"].groups).toEqual([
      "writers",
    ]);
  });

  test("preserves existing users and defaultAccess", () => {
    seedUsersYaml();
    upsertUser("alice@test.local", ["team-a"]);
    const config = loadUsersConfig();
    expect(config.users["admin@test.local"].groups).toEqual(["admins"]);
    expect(config.users["writer@test.local"].groups).toEqual(["writers"]);
    expect(config.defaultAccess.write).toEqual(["writers"]);
  });

  test("updates groups for an existing user", () => {
    seedUsersYaml();
    upsertUser("writer@test.local", ["team-a", "team-b"]);
    expect(loadUsersConfig().users["writer@test.local"].groups).toEqual([
      "team-a",
      "team-b",
    ]);
  });

  test("creates users.yaml when none exists yet", () => {
    expect(existsSync(join(testDir, ".settings", "users.yaml"))).toBe(false);
    upsertUser("first@test.local", ["admins"]);
    expect(existsSync(join(testDir, ".settings", "users.yaml"))).toBe(true);
    expect(
      calculateUserGroups("first@test.local", loadUsersConfig())
    ).toContain("admins");
  });
});

describe("removeUser", () => {
  test("removes an existing user and returns true", () => {
    seedUsersYaml();
    expect(removeUser("writer@test.local")).toBe(true);
    expect(loadUsersConfig().users["writer@test.local"]).toBeUndefined();
  });

  test("returns false when the user does not exist", () => {
    seedUsersYaml();
    expect(removeUser("ghost@test.local")).toBe(false);
  });

  test("a removed user resolves to no groups (revocation)", () => {
    seedUsersYaml();
    removeUser("writer@test.local");
    expect(
      calculateUserGroups("writer@test.local", loadUsersConfig())
    ).toEqual([]);
  });
});

describe("listUsers", () => {
  test("returns the membership map", () => {
    seedUsersYaml();
    const users = listUsers();
    expect(Object.keys(users).sort()).toEqual([
      "admin@test.local",
      "writer@test.local",
    ]);
    expect(users["admin@test.local"].groups).toEqual(["admins"]);
  });
});
