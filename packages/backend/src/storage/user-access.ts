import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { getPagesRoot } from "./path-validator.js";
import { readPage } from "./page-storage.js";

export interface UsersConfig {
  defaultAccess: {
    read: string[];
    write: string[];
  };
  users: Record<string, { groups: string[] }>;
}

export interface PageAccess {
  read?: string[];
  write?: string[];
}

const DEFAULT_CONFIG: UsersConfig = {
  defaultAccess: {
    read: ["everyone"],
    write: ["writers"],
  },
  users: {},
};

export function loadUsersConfig(): UsersConfig {
  const pagesRoot = getPagesRoot();
  const configPath = join(pagesRoot, ".settings", "users.yaml");

  if (!existsSync(configPath)) {
    console.log("[Access Control] No users.yaml found, using default open access");
    return {
      defaultAccess: {
        read: ["everyone"],
        write: ["everyone"],
      },
      users: {},
    };
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const config = yaml.load(content) as UsersConfig;

    if (!config.defaultAccess) {
      config.defaultAccess = DEFAULT_CONFIG.defaultAccess;
    }
    if (!config.users) {
      config.users = {};
    }

    return config;
  } catch (error) {
    console.error("[Access Control] Error loading users.yaml:", error);
    return DEFAULT_CONFIG;
  }
}

export function calculateUserGroups(email: string, config: UsersConfig): string[] {
  const userEntry = config.users[email];

  if (!userEntry) {
    return [];
  }

  const groups = ["everyone", ...(userEntry.groups || [])];
  return [...new Set(groups)];
}

export function resolvePageAccess(pagePath: string, config: UsersConfig): PageAccess {
  const page = readPage(pagePath);
  
  if (!page) {
    return config.defaultAccess;
  }

  const frontMatterAccess = page.frontMatter.__access as PageAccess | undefined;

  if (frontMatterAccess) {
    return {
      read: frontMatterAccess.read,
      write: frontMatterAccess.write,
    };
  }

  if (page.parent) {
    return resolvePageAccess(page.parent, config);
  }

  return config.defaultAccess;
}

export function checkPageAccess(
  userGroups: string[],
  pagePath: string,
  accessType: "read" | "write",
  config: UsersConfig
): boolean {
  if (userGroups.length === 0) {
    return false;
  }

  if (userGroups.includes("admins")) {
    return true;
  }

  const pageAccess = resolvePageAccess(pagePath, config);
  const requiredGroups = pageAccess[accessType];

  if (!requiredGroups || requiredGroups.length === 0) {
    return false;
  }

  return requiredGroups.some((group) => userGroups.includes(group));
}

export function filterAccessiblePages(pages: string[], userGroups: string[], config: UsersConfig): string[] {
  return pages.filter((pagePath) => checkPageAccess(userGroups, pagePath, "read", config));
}
