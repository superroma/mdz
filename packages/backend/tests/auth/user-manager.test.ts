import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { getUserManager, resetUserManager } from "../../src/auth/user-manager.js";

const TEST_PAGES_ROOT = join(process.cwd(), "test-pages-auth");
const TEST_SETTINGS_DIR = join(TEST_PAGES_ROOT, ".settings");
const TEST_USERS_FILE = join(TEST_SETTINGS_DIR, "users.yaml");

describe("UserManager", () => {
  beforeEach(() => {
    // Set up test environment
    process.env.PAGES_ROOT = TEST_PAGES_ROOT;
    
    // Create test directory
    if (existsSync(TEST_PAGES_ROOT)) {
      rmSync(TEST_PAGES_ROOT, { recursive: true, force: true });
    }
    mkdirSync(TEST_SETTINGS_DIR, { recursive: true });
    
    // Create test users.yaml
    const testConfig = `
users:
  "user-123":
    name: "Admin User"
    email: "admin@example.com"
    groups:
      - admins
  
  "user-456":
    name: "Editor User"
    email: "editor@example.com"
    groups:
      - editors
      - reviewers
  
  "user-789":
    name: "Regular User"
    email: "user@example.com"
    groups:
      - readers

default_access:
  readers: [everyone]
  editors: [admins]
`;
    
    writeFileSync(TEST_USERS_FILE, testConfig, "utf-8");
    
    // Reset singleton
    resetUserManager();
  });

  afterEach(() => {
    // Clean up
    if (existsSync(TEST_PAGES_ROOT)) {
      rmSync(TEST_PAGES_ROOT, { recursive: true, force: true });
    }
    delete process.env.PAGES_ROOT;
    resetUserManager();
  });

  describe("getUserById", () => {
    it("should return user by ID", () => {
      const userManager = getUserManager();
      const user = userManager.getUserById("user-123");
      
      expect(user).toBeDefined();
      expect(user?.id).toBe("user-123");
      expect(user?.name).toBe("Admin User");
      expect(user?.email).toBe("admin@example.com");
      expect(user?.groups).toContain("admins");
    });

    it("should return null for non-existent user", () => {
      const userManager = getUserManager();
      const user = userManager.getUserById("non-existent");
      
      expect(user).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user by email", () => {
      const userManager = getUserManager();
      const user = userManager.getUserByEmail("editor@example.com");
      
      expect(user).toBeDefined();
      expect(user?.id).toBe("user-456");
      expect(user?.name).toBe("Editor User");
    });

    it("should be case-insensitive", () => {
      const userManager = getUserManager();
      const user = userManager.getUserByEmail("EDITOR@EXAMPLE.COM");
      
      expect(user).toBeDefined();
      expect(user?.id).toBe("user-456");
    });

    it("should return null for non-existent email", () => {
      const userManager = getUserManager();
      const user = userManager.getUserByEmail("nonexistent@example.com");
      
      expect(user).toBeNull();
    });
  });

  describe("isUserInGroup", () => {
    it("should return true for user in group", () => {
      const userManager = getUserManager();
      expect(userManager.isUserInGroup("user-123", "admins")).toBe(true);
      expect(userManager.isUserInGroup("user-456", "editors")).toBe(true);
      expect(userManager.isUserInGroup("user-456", "reviewers")).toBe(true);
    });

    it("should return false for user not in group", () => {
      const userManager = getUserManager();
      expect(userManager.isUserInGroup("user-789", "admins")).toBe(false);
      expect(userManager.isUserInGroup("user-123", "editors")).toBe(false);
    });

    it("should return true for everyone group", () => {
      const userManager = getUserManager();
      expect(userManager.isUserInGroup("user-123", "everyone")).toBe(true);
      expect(userManager.isUserInGroup("user-456", "everyone")).toBe(true);
      expect(userManager.isUserInGroup("user-789", "everyone")).toBe(true);
    });

    it("should return false for non-existent user", () => {
      const userManager = getUserManager();
      expect(userManager.isUserInGroup("non-existent", "admins")).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin user", () => {
      const userManager = getUserManager();
      expect(userManager.isAdmin("user-123")).toBe(true);
    });

    it("should return false for non-admin user", () => {
      const userManager = getUserManager();
      expect(userManager.isAdmin("user-456")).toBe(false);
      expect(userManager.isAdmin("user-789")).toBe(false);
    });
  });

  describe("getDefaultAccess", () => {
    it("should return configured default access", () => {
      const userManager = getUserManager();
      const defaultAccess = userManager.getDefaultAccess();
      
      expect(defaultAccess.readers).toEqual(["everyone"]);
      expect(defaultAccess.editors).toEqual(["admins"]);
    });
  });

  describe("matchesAccessList", () => {
    it("should match user ID", () => {
      const userManager = getUserManager();
      expect(userManager.matchesAccessList("user-123", ["user-123", "user-456"])).toBe(true);
    });

    it("should match user email", () => {
      const userManager = getUserManager();
      expect(userManager.matchesAccessList("user-123", ["admin@example.com"])).toBe(true);
    });

    it("should match group membership", () => {
      const userManager = getUserManager();
      expect(userManager.matchesAccessList("user-123", ["admins"])).toBe(true);
      expect(userManager.matchesAccessList("user-456", ["editors", "reviewers"])).toBe(true);
    });

    it("should match everyone group", () => {
      const userManager = getUserManager();
      expect(userManager.matchesAccessList("user-789", ["everyone"])).toBe(true);
    });

    it("should not match if user not in list", () => {
      const userManager = getUserManager();
      expect(userManager.matchesAccessList("user-789", ["admins", "editors"])).toBe(false);
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", () => {
      const userManager = getUserManager();
      const allUsers = userManager.getAllUsers();
      
      expect(allUsers).toHaveLength(3);
      expect(allUsers.map(u => u.id)).toContain("user-123");
      expect(allUsers.map(u => u.id)).toContain("user-456");
      expect(allUsers.map(u => u.id)).toContain("user-789");
    });
  });

  describe("missing config file", () => {
    it("should handle missing users.yaml gracefully", () => {
      // Remove config file
      unlinkSync(TEST_USERS_FILE);
      resetUserManager();
      
      const userManager = getUserManager();
      expect(userManager.getAllUsers()).toHaveLength(0);
      expect(userManager.getDefaultAccess()).toEqual({
        readers: ["everyone"],
        editors: ["admins"]
      });
    });
  });
});
