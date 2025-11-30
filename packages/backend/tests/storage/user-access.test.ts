import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadUsersConfig,
  calculateUserGroups,
  checkPageAccess,
  resolvePageAccess,
} from "../../src/storage/user-access";
import { createPage } from "../../src/storage/page-storage";

let testDir: string;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "access-test-"));
  process.env.PAGES_ROOT = testDir;
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
});

describe("loadUsersConfig", () => {
  test("returns default config when users.yaml does not exist", () => {
    const config = loadUsersConfig();
    expect(config.defaultAccess.read).toEqual(["everyone"]);
    expect(config.defaultAccess.write).toEqual(["everyone"]);
    expect(config.users).toEqual({});
  });

  test("loads and parses users.yaml", () => {
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
`;
    writeFileSync(join(settingsDir, "users.yaml"), usersYaml);

    const config = loadUsersConfig();
    expect(config.defaultAccess.read).toEqual(["everyone"]);
    expect(config.defaultAccess.write).toEqual(["writers"]);
    expect(config.users["admin@test.local"].groups).toEqual(["admins"]);
    expect(config.users["writer@test.local"].groups).toEqual(["writers"]);
  });

  test("uses defaults when defaultAccess is missing", () => {
    const settingsDir = join(testDir, ".settings");
    mkdirSync(settingsDir, { recursive: true });

    const usersYaml = `users:
  admin@test.local:
    groups: [admins]
`;
    writeFileSync(join(settingsDir, "users.yaml"), usersYaml);

    const config = loadUsersConfig();
    expect(config.defaultAccess.read).toEqual(["everyone"]);
    expect(config.defaultAccess.write).toEqual(["writers"]);
  });

  test("handles malformed YAML gracefully", () => {
    const settingsDir = join(testDir, ".settings");
    mkdirSync(settingsDir, { recursive: true });

    const usersYaml = `this is not: [valid: yaml`;
    writeFileSync(join(settingsDir, "users.yaml"), usersYaml);

    const config = loadUsersConfig();
    expect(config.defaultAccess).toBeDefined();
    expect(config.users).toBeDefined();
  });
});

describe("calculateUserGroups", () => {
  test("returns empty array for user not in config", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    const groups = calculateUserGroups("unknown@test.local", config);
    expect(groups).toEqual([]);
  });

  test("returns everyone plus user groups", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "admin@test.local": { groups: ["admins"] },
      },
    };

    const groups = calculateUserGroups("admin@test.local", config);
    expect(groups).toContain("everyone");
    expect(groups).toContain("admins");
    expect(groups.length).toBe(2);
  });

  test("handles user with no groups", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "reader@test.local": { groups: [] },
      },
    };

    const groups = calculateUserGroups("reader@test.local", config);
    expect(groups).toEqual(["everyone"]);
  });

  test("deduplicates groups", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "user@test.local": { groups: ["everyone", "writers"] },
      },
    };

    const groups = calculateUserGroups("user@test.local", config);
    const uniqueGroups = [...new Set(groups)];
    expect(groups.length).toBe(uniqueGroups.length);
  });

  test("handles multiple groups", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "user@test.local": { groups: ["writers", "team-a", "team-b"] },
      },
    };

    const groups = calculateUserGroups("user@test.local", config);
    expect(groups).toContain("everyone");
    expect(groups).toContain("writers");
    expect(groups).toContain("team-a");
    expect(groups).toContain("team-b");
  });
});

describe("checkPageAccess", () => {
  test("denies access for user with no groups", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    createPage("TestPage", "# Test");

    const canRead = checkPageAccess([], "TestPage", "read", config);
    expect(canRead).toBe(false);
  });

  test("allows read for everyone group", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    createPage("TestPage", "# Test");

    const canRead = checkPageAccess(["everyone"], "TestPage", "read", config);
    expect(canRead).toBe(true);
  });

  test("denies write for everyone without writers group", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    createPage("TestPage", "# Test");

    const canWrite = checkPageAccess(["everyone"], "TestPage", "write", config);
    expect(canWrite).toBe(false);
  });

  test("allows write for writers group", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    createPage("TestPage", "# Test");

    const canWrite = checkPageAccess(
      ["everyone", "writers"],
      "TestPage",
      "write",
      config
    );
    expect(canWrite).toBe(true);
  });

  test("admins have read access to everything", () => {
    const config = {
      defaultAccess: { read: ["restricted"], write: ["restricted"] },
      users: {},
    };

    createPage("TestPage", "# Test");

    const canRead = checkPageAccess(["admins"], "TestPage", "read", config);
    expect(canRead).toBe(true);
  });

  test("admins have write access to everything", () => {
    const config = {
      defaultAccess: { read: ["restricted"], write: ["restricted"] },
      users: {},
    };

    createPage("TestPage", "# Test");

    const canWrite = checkPageAccess(["admins"], "TestPage", "write", config);
    expect(canWrite).toBe(true);
  });

  test("respects explicit page access control", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    const content = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Restricted Page`;

    createPage("RestrictedPage", content);

    const canReadEveryone = checkPageAccess(
      ["everyone"],
      "RestrictedPage",
      "read",
      config
    );
    expect(canReadEveryone).toBe(false);

    const canReadTeamA = checkPageAccess(
      ["team-a"],
      "RestrictedPage",
      "read",
      config
    );
    expect(canReadTeamA).toBe(true);
  });
});

describe("resolvePageAccess", () => {
  test("returns defaultAccess for non-existent page", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    const access = resolvePageAccess("NonExistent", config);
    expect(access.read).toEqual(["everyone"]);
    expect(access.write).toEqual(["writers"]);
  });

  test("returns page frontmatter access if present", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    const content = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Page`;

    createPage("TestPage", content);

    const access = resolvePageAccess("TestPage", config);
    expect(access.read).toEqual(["team-a"]);
    expect(access.write).toEqual(["team-a"]);
  });

  test("inherits access from parent page", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    const parentContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Parent`;

    createPage("Parent", parentContent);
    createPage("Parent/Child", "# Child");

    const access = resolvePageAccess("Parent/Child", config);
    expect(access.read).toEqual(["team-a"]);
    expect(access.write).toEqual(["team-a"]);
  });

  test("uses defaultAccess for page without parent or frontmatter", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    createPage("SimplePage", "# Simple");

    const access = resolvePageAccess("SimplePage", config);
    expect(access.read).toEqual(["everyone"]);
    expect(access.write).toEqual(["writers"]);
  });

  test("child access overrides parent access", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    const parentContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Parent`;

    const childContent = `---
__access:
  read: [everyone]
  write: [team-b]
---
# Child`;

    createPage("Parent", parentContent);
    createPage("Parent/Child", childContent);

    const access = resolvePageAccess("Parent/Child", config);
    expect(access.read).toEqual(["everyone"]);
    expect(access.write).toEqual(["team-b"]);
  });

  test("handles partial access specification", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    const content = `---
__access:
  read: [team-a]
---
# Page`;

    createPage("TestPage", content);

    const access = resolvePageAccess("TestPage", config);
    expect(access.read).toEqual(["team-a"]);
    expect(access.write).toBeUndefined();
  });

  test("multi-level inheritance", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {},
    };

    const grandparentContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Grandparent`;

    createPage("Grandparent", grandparentContent);
    createPage("Grandparent/Parent", "# Parent");
    createPage("Grandparent/Parent/Child", "# Child");

    const access = resolvePageAccess("Grandparent/Parent/Child", config);
    expect(access.read).toEqual(["team-a"]);
    expect(access.write).toEqual(["team-a"]);
  });
});

describe("integration scenarios", () => {
  test("admin user can access everything", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "admin@test.local": { groups: ["admins"] },
      },
    };

    const restrictedContent = `---
__access:
  read: [secret-team]
  write: [secret-team]
---
# Secret`;

    createPage("SecretPage", restrictedContent);

    const userGroups = calculateUserGroups("admin@test.local", config);
    const canRead = checkPageAccess(userGroups, "SecretPage", "read", config);
    const canWrite = checkPageAccess(userGroups, "SecretPage", "write", config);

    expect(canRead).toBe(true);
    expect(canWrite).toBe(true);
  });

  test("writer can write to default pages but not restricted ones", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "writer@test.local": { groups: ["writers"] },
      },
    };

    createPage("PublicPage", "# Public");

    const restrictedContent = `---
__access:
  read: [admins]
  write: [admins]
---
# Admin Only`;

    createPage("AdminPage", restrictedContent);

    const userGroups = calculateUserGroups("writer@test.local", config);

    const canWritePublic = checkPageAccess(
      userGroups,
      "PublicPage",
      "write",
      config
    );
    expect(canWritePublic).toBe(true);

    const canReadAdmin = checkPageAccess(
      userGroups,
      "AdminPage",
      "read",
      config
    );
    expect(canReadAdmin).toBe(false);
  });

  test("reader can only read everyone pages", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "reader@test.local": { groups: [] },
      },
    };

    createPage("PublicPage", "# Public");

    const userGroups = calculateUserGroups("reader@test.local", config);

    const canRead = checkPageAccess(userGroups, "PublicPage", "read", config);
    expect(canRead).toBe(true);

    const canWrite = checkPageAccess(userGroups, "PublicPage", "write", config);
    expect(canWrite).toBe(false);
  });

  test("unknown user has no access", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "known@test.local": { groups: ["writers"] },
      },
    };

    createPage("PublicPage", "# Public");

    const userGroups = calculateUserGroups("unknown@test.local", config);

    expect(userGroups).toEqual([]);

    const canRead = checkPageAccess(userGroups, "PublicPage", "read", config);
    expect(canRead).toBe(false);
  });

  test("team member can access team pages", () => {
    const config = {
      defaultAccess: { read: ["everyone"], write: ["writers"] },
      users: {
        "alice@test.local": { groups: ["team-a"] },
        "bob@test.local": { groups: ["team-b"] },
      },
    };

    const teamAContent = `---
__access:
  read: [team-a]
  write: [team-a]
---
# Team A Page`;

    createPage("TeamAPage", teamAContent);

    const aliceGroups = calculateUserGroups("alice@test.local", config);
    const bobGroups = calculateUserGroups("bob@test.local", config);

    const aliceCanRead = checkPageAccess(
      aliceGroups,
      "TeamAPage",
      "read",
      config
    );
    expect(aliceCanRead).toBe(true);

    const bobCanRead = checkPageAccess(bobGroups, "TeamAPage", "read", config);
    expect(bobCanRead).toBe(false);
  });
});
