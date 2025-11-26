import { AuthenticatedUser } from "./jwt-middleware.js";
import { getUserManager } from "./user-manager.js";
import { readPage, Page } from "../storage/page-storage.js";
import { dirname } from "node:path";

export interface AccessRights {
  readers?: string[];
  editors?: string[];
}

export type PermissionType = "read" | "write";

/**
 * Extract access rights from page frontmatter
 */
function getAccessRightsFromPage(page: Page): AccessRights | null {
  const frontMatter = page.frontMatter;
  
  if (!frontMatter.access || typeof frontMatter.access !== "object") {
    return null;
  }

  const access = frontMatter.access as Record<string, unknown>;
  const result: AccessRights = {};

  if (Array.isArray(access.readers)) {
    result.readers = access.readers.filter((item): item is string => typeof item === "string");
  }

  if (Array.isArray(access.editors)) {
    result.editors = access.editors.filter((item): item is string => typeof item === "string");
  }

  // Return null if no valid access rights found
  if (!result.readers && !result.editors) {
    return null;
  }

  return result;
}

/**
 * Find access rights by walking up the page hierarchy
 * Returns the first page with access rights, or null if none found
 */
export function findInheritedAccessRights(pagePath: string): AccessRights | null {
  let currentPath = pagePath;

  // Walk up the hierarchy
  while (currentPath) {
    try {
      const page = readPage(currentPath);
      if (page) {
        const accessRights = getAccessRightsFromPage(page);
        if (accessRights) {
          return accessRights;
        }
      }
    } catch (error) {
      // Page doesn't exist or can't be read, continue walking up
    }

    // Move to parent
    const parentDir = dirname(currentPath);
    if (!parentDir || parentDir === "." || parentDir === currentPath) {
      break;
    }
    currentPath = parentDir;
  }

  // No access rights found in hierarchy
  return null;
}

/**
 * Get effective access rights for a page
 * Uses inheritance and falls back to defaults
 */
export function getEffectiveAccessRights(pagePath: string): AccessRights {
  const userManager = getUserManager();

  // First try to get access rights from the page itself
  try {
    const page = readPage(pagePath);
    if (page) {
      const accessRights = getAccessRightsFromPage(page);
      if (accessRights) {
        return accessRights;
      }
    }
  } catch (error) {
    // Page doesn't exist, fall through to inheritance
  }

  // Try to inherit from parent hierarchy
  const inheritedRights = findInheritedAccessRights(pagePath);
  if (inheritedRights) {
    return inheritedRights;
  }

  // Fall back to default access
  const defaultAccess = userManager.getDefaultAccess();
  return {
    readers: defaultAccess.readers,
    editors: defaultAccess.editors
  };
}

/**
 * Check if a user has a specific permission for a page
 */
export function checkPermission(
  user: AuthenticatedUser | undefined,
  pagePath: string,
  permissionType: PermissionType
): boolean {
  // No user = no access
  if (!user) {
    return false;
  }

  // Admins bypass all permission checks
  if (user.isAdmin) {
    return true;
  }

  const userManager = getUserManager();
  const accessRights = getEffectiveAccessRights(pagePath);

  // Check read permission
  if (permissionType === "read") {
    // If user can edit, they can also read
    if (accessRights.editors && userManager.matchesAccessList(user.id, accessRights.editors)) {
      return true;
    }
    
    if (!accessRights.readers || accessRights.readers.length === 0) {
      // No readers specified, only editors can read
      return false;
    }
    return userManager.matchesAccessList(user.id, accessRights.readers);
  }

  // Check write permission
  if (permissionType === "write") {
    if (!accessRights.editors || accessRights.editors.length === 0) {
      // No editors specified, only admins can edit
      return false;
    }
    return userManager.matchesAccessList(user.id, accessRights.editors);
  }

  return false;
}

/**
 * Check if user can read a page
 */
export function canRead(user: AuthenticatedUser | undefined, pagePath: string): boolean {
  return checkPermission(user, pagePath, "read");
}

/**
 * Check if user can write to a page
 */
export function canWrite(user: AuthenticatedUser | undefined, pagePath: string): boolean {
  return checkPermission(user, pagePath, "write");
}

/**
 * Check if user can create a child page under a parent
 * Requires write permission on the parent
 */
export function canCreateChild(
  user: AuthenticatedUser | undefined,
  parentPath: string
): boolean {
  return checkPermission(user, parentPath, "write");
}

/**
 * Filter a list of pages based on user's read permissions
 */
export function filterPagesByPermission(
  user: AuthenticatedUser | undefined,
  pages: Page[]
): Page[] {
  // No user = no pages
  if (!user) {
    return [];
  }

  // Admins see all pages
  if (user.isAdmin) {
    return pages;
  }

  // Filter pages by read permission
  return pages.filter((page) => canRead(user, page.path));
}

/**
 * Get access rights for display/editing in the UI
 * Only admins can see and edit access rights
 */
export function getAccessRightsForUI(
  user: AuthenticatedUser | undefined,
  pagePath: string
): AccessRights | null {
  if (!user || !user.isAdmin) {
    return null;
  }

  return getEffectiveAccessRights(pagePath);
}

/**
 * Validate that a user can set specific access rights
 * Only admins can set access rights, and they must be valid
 */
export function validateAccessRights(
  user: AuthenticatedUser | undefined,
  accessRights: AccessRights
): { valid: boolean; error?: string } {
  if (!user || !user.isAdmin) {
    return { valid: false, error: "Only admins can set access rights" };
  }

  // Validate that readers and editors are arrays of strings
  if (accessRights.readers && !Array.isArray(accessRights.readers)) {
    return { valid: false, error: "readers must be an array" };
  }

  if (accessRights.editors && !Array.isArray(accessRights.editors)) {
    return { valid: false, error: "editors must be an array" };
  }

  // Validate that all items are strings
  if (accessRights.readers) {
    for (const item of accessRights.readers) {
      if (typeof item !== "string") {
        return { valid: false, error: "All reader entries must be strings" };
      }
    }
  }

  if (accessRights.editors) {
    for (const item of accessRights.editors) {
      if (typeof item !== "string") {
        return { valid: false, error: "All editor entries must be strings" };
      }
    }
  }

  return { valid: true };
}
