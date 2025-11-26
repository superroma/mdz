import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  checkPermission,
  canRead,
  canWrite,
  canCreateChild,
  getEffectiveAccessRights,
  filterPagesByPermission
} from "../../src/auth/permissions.js";
import { getUserManager, resetUserManager } from "../../src/auth/user-manager.js";
import { createPage, listPages, Page } from "../../src/storage/page-storage.js";
import type { AuthenticatedUser } from "../../src/auth/jwt-middleware.js";

const TEST_PAGES_ROOT = join(process.cwd(), "test-pages-permissions");
const TEST_SETTINGS_DIR = join(TEST_PAGES_ROOT, ".settings");
const TEST_USERS_FILE = join(TEST_SETTINGS_DIR, "users.yaml");

const mockAdminUser: AuthenticatedUser = {
  id: "admin-123",
  email: "admin@example.com",
  name: "Admin User",
  groups: ["admins"],
  isAdmin: true
};

const mockEditorUser: AuthenticatedUser = {
  id: "editor-456",
  email: "editor@example.com",
  name: "Editor User",
  groups: ["editors"],
  isAdmin: false
};

const mockReaderUser: AuthenticatedUser = {
  id: "reader-789",
  email: "reader@example.com",
  name: "Reader User",
  groups: ["readers"],
  isAdmin: false
};

describe("Permissions", () => {
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
  "admin-123":
    name: "Admin User"
    email: "admin@example.com"
    groups:
      - admins
  
  "editor-456":
    name: "Editor User"
    email: "editor@example.com"
    groups:
      - editors
  
  "reader-789":
    name: "Reader User"
    email: "reader@example.com"
    groups:
      - readers

default_access:
  readers: [everyone]
  editors: [editors]
`;
    
    writeFileSync(TEST_USERS_FILE, testConfig, "utf-8");
    
    // Reset singleton
    resetUserManager();
    
    // Load user manager
    getUserManager();
  });

  afterEach(() => {
    // Clean up
    if (existsSync(TEST_PAGES_ROOT)) {
      rmSync(TEST_PAGES_ROOT, { recursive: true, force: true });
    }
    delete process.env.PAGES_ROOT;
    resetUserManager();
  });

  describe("Admin bypass", () => {
    it("should allow admins to read any page", () => {
      createPage("test-page", "Test content");
      expect(canRead(mockAdminUser, "test-page")).toBe(true);
    });

    it("should allow admins to write any page", () => {
      createPage("test-page", "Test content");
      expect(canWrite(mockAdminUser, "test-page")).toBe(true);
    });

    it("should allow admins to create children anywhere", () => {
      createPage("parent", "Parent content");
      expect(canCreateChild(mockAdminUser, "parent")).toBe(true);
    });
  });

  describe("Default access", () => {
    it("should use default access when no frontmatter specified", () => {
      createPage("public-page", "# Public Page\n\nEveryone can read this.");
      
      // Everyone can read (default)
      expect(canRead(mockReaderUser, "public-page")).toBe(true);
      expect(canRead(mockEditorUser, "public-page")).toBe(true);
      
      // Only editors can write (default)
      expect(canWrite(mockReaderUser, "public-page")).toBe(false);
      expect(canWrite(mockEditorUser, "public-page")).toBe(true);
    });
  });

  describe("Page-specific access", () => {
    it("should enforce page-specific access rights", () => {
      const content = `---
access:
  readers: [editors]
  editors: [editors]
---
# Restricted Page

Only editors can see this.`;
      
      createPage("restricted", content);
      
      // Only editors can read
      expect(canRead(mockReaderUser, "restricted")).toBe(false);
      expect(canRead(mockEditorUser, "restricted")).toBe(true);
      
      // Only editors can write
      expect(canWrite(mockReaderUser, "restricted")).toBe(false);
      expect(canWrite(mockEditorUser, "restricted")).toBe(true);
    });

    it("should support individual user IDs in access list", () => {
      const content = `---
access:
  readers: [reader-789]
  editors: [editor-456]
---
# Individual Access`;
      
      createPage("individual", content);
      
      expect(canRead(mockReaderUser, "individual")).toBe(true);
      expect(canRead(mockEditorUser, "individual")).toBe(true);
      expect(canWrite(mockReaderUser, "individual")).toBe(false);
      expect(canWrite(mockEditorUser, "individual")).toBe(true);
    });
  });

  describe("Inheritance", () => {
    it("should inherit access rights from parent", () => {
      const parentContent = `---
access:
  readers: [editors]
  editors: [editors]
---
# Parent Page`;
      
      createPage("parent", parentContent);
      createPage("parent/child", "# Child Page\n\nInherits from parent.");
      
      // Child inherits parent's restrictions
      expect(canRead(mockReaderUser, "parent/child")).toBe(false);
      expect(canRead(mockEditorUser, "parent/child")).toBe(true);
      expect(canWrite(mockReaderUser, "parent/child")).toBe(false);
      expect(canWrite(mockEditorUser, "parent/child")).toBe(true);
    });

    it("should allow child to override parent access", () => {
      const parentContent = `---
access:
  readers: [editors]
  editors: [editors]
---
# Restricted Parent`;
      
      const childContent = `---
access:
  readers: [everyone]
  editors: [editors]
---
# Public Child`;
      
      createPage("parent", parentContent);
      createPage("parent/child", childContent);
      
      // Parent is restricted
      expect(canRead(mockReaderUser, "parent")).toBe(false);
      
      // Child overrides to be public
      expect(canRead(mockReaderUser, "parent/child")).toBe(true);
    });
  });

  describe("filterPagesByPermission", () => {
    it("should filter pages based on read permissions", () => {
      const restrictedContent = `---
access:
  readers: [editors]
  editors: [editors]
---
# Restricted`;
      
      createPage("public", "# Public");
      createPage("restricted", restrictedContent);
      
      const allPages = listPages();
      
      // Public uses default access (readers: [everyone])
      expect(canRead(mockReaderUser, "public")).toBe(true);
      // Restricted has readers: [editors], reader user is not in editors group
      expect(canRead(mockReaderUser, "restricted")).toBe(false);
      
      const readerPages = filterPagesByPermission(mockReaderUser, allPages);
      const editorPages = filterPagesByPermission(mockEditorUser, allPages);
      
      // Filter out .settings pages from results for testing
      const readerNonSettingsPages = readerPages.filter(p => !p.path.startsWith('.settings'));
      const editorNonSettingsPages = editorPages.filter(p => !p.path.startsWith('.settings'));
      
      // Reader can only see public page (excluding .settings)
      expect(readerNonSettingsPages.length).toBe(1);
      expect(readerNonSettingsPages[0].path).toBe("public");
      
      // Editor can see both public and restricted (excluding .settings)
      expect(editorNonSettingsPages.length).toBe(2);
    });

    it("should return all pages for admin", () => {
      createPage("page1", "# Page 1");
      createPage("page2", "# Page 2");
      createPage("page3", "# Page 3");
      
      const allPages = listPages();
      const adminPages = filterPagesByPermission(mockAdminUser, allPages);
      
      expect(adminPages.length).toBe(allPages.length);
    });

    it("should return empty array for undefined user", () => {
      createPage("page1", "# Page 1");
      
      const allPages = listPages();
      const pages = filterPagesByPermission(undefined, allPages);
      
      expect(pages.length).toBe(0);
    });
  });

  describe("getEffectiveAccessRights", () => {
    it("should return page-specific access rights", () => {
      const content = `---
access:
  readers: [editors]
  editors: [admins]
---
# Page`;
      
      createPage("test", content);
      
      const rights = getEffectiveAccessRights("test");
      expect(rights.readers).toEqual(["editors"]);
      expect(rights.editors).toEqual(["admins"]);
    });

    it("should return inherited access rights", () => {
      const parentContent = `---
access:
  readers: [editors]
  editors: [editors]
---
# Parent`;
      
      createPage("parent", parentContent);
      createPage("parent/child", "# Child");
      
      const rights = getEffectiveAccessRights("parent/child");
      expect(rights.readers).toEqual(["editors"]);
      expect(rights.editors).toEqual(["editors"]);
    });

    it("should return default access rights when no config found", () => {
      createPage("test", "# Test");
      
      const rights = getEffectiveAccessRights("test");
      expect(rights.readers).toEqual(["everyone"]);
      expect(rights.editors).toEqual(["editors"]);
    });
  });

  describe("No user", () => {
    it("should deny all access for undefined user", () => {
      createPage("test", "# Test");
      
      expect(canRead(undefined, "test")).toBe(false);
      expect(canWrite(undefined, "test")).toBe(false);
      expect(canCreateChild(undefined, "test")).toBe(false);
    });
  });
});
