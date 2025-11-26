import { readFileSync, existsSync, watch } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { getPagesRoot } from "../storage/path-validator.js";

export interface User {
  id: string;
  name: string;
  email: string;
  groups: string[];
}

export interface UsersConfig {
  users: Record<string, {
    name: string;
    email: string;
    groups: string[];
  }>;
  group_descriptions?: Record<string, string>;
  default_access?: {
    readers: string[];
    editors: string[];
  };
}

export interface AccessConfig {
  readers: string[];
  editors: string[];
}

class UserManager {
  private usersCache: Map<string, User> = new Map();
  private emailToIdCache: Map<string, string> = new Map();
  private defaultAccessCache: AccessConfig | null = null;
  private lastLoadTime: number = 0;
  private configPath: string;

  constructor() {
    this.configPath = join(getPagesRoot(), ".settings", "users.yaml");
    this.loadUsers();
    this.watchConfigFile();
  }

  private watchConfigFile(): void {
    if (!existsSync(this.configPath)) {
      return;
    }

    try {
      watch(this.configPath, (eventType) => {
        if (eventType === "change") {
          console.log("Users config file changed, reloading...");
          this.loadUsers();
        }
      });
    } catch (error) {
      console.warn("Could not watch users config file:", error);
    }
  }

  private loadUsers(): void {
    try {
      if (!existsSync(this.configPath)) {
        console.warn(`Users config not found at ${this.configPath}, using empty config`);
        this.usersCache.clear();
        this.emailToIdCache.clear();
        this.defaultAccessCache = {
          readers: ["everyone"],
          editors: ["admins"]
        };
        this.lastLoadTime = Date.now();
        return;
      }

      const fileContent = readFileSync(this.configPath, "utf-8");
      const config = yaml.load(fileContent) as UsersConfig;

      // Clear caches
      this.usersCache.clear();
      this.emailToIdCache.clear();

      // Load users
      if (config.users) {
        for (const [userId, userData] of Object.entries(config.users)) {
          const user: User = {
            id: userId,
            name: userData.name,
            email: userData.email,
            groups: userData.groups || []
          };
          this.usersCache.set(userId, user);
          this.emailToIdCache.set(userData.email.toLowerCase(), userId);
        }
      }

      // Load default access
      if (config.default_access) {
        this.defaultAccessCache = {
          readers: config.default_access.readers || ["everyone"],
          editors: config.default_access.editors || ["admins"]
        };
      } else {
        this.defaultAccessCache = {
          readers: ["everyone"],
          editors: ["admins"]
        };
      }

      this.lastLoadTime = Date.now();
      console.log(`Loaded ${this.usersCache.size} users from config`);
    } catch (error) {
      console.error("Error loading users config:", error);
      throw new Error("Failed to load users configuration");
    }
  }

  /**
   * Get user by ID (from JWT 'sub' claim)
   */
  getUserById(userId: string): User | null {
    return this.usersCache.get(userId) || null;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | null {
    const userId = this.emailToIdCache.get(email.toLowerCase());
    if (!userId) {
      return null;
    }
    return this.usersCache.get(userId) || null;
  }

  /**
   * Check if a user is in a specific group
   * Supports 'admins' and 'everyone' virtual groups
   */
  isUserInGroup(userId: string, groupName: string): boolean {
    // Special case: 'everyone' means any authenticated user
    if (groupName === "everyone") {
      return true;
    }

    const user = this.getUserById(userId);
    if (!user) {
      return false;
    }

    return user.groups.includes(groupName);
  }

  /**
   * Check if a user is an admin
   */
  isAdmin(userId: string): boolean {
    return this.isUserInGroup(userId, "admins");
  }

  /**
   * Get default access configuration
   */
  getDefaultAccess(): AccessConfig {
    return this.defaultAccessCache || {
      readers: ["everyone"],
      editors: ["admins"]
    };
  }

  /**
   * Check if a user ID or email matches any item in an access list
   * Access list can contain group names or individual user IDs
   */
  matchesAccessList(userId: string, accessList: string[]): boolean {
    const user = this.getUserById(userId);
    
    for (const item of accessList) {
      // Check if it's the user's ID
      if (item === userId) {
        return true;
      }

      // Check if it's the user's email
      if (user && item === user.email) {
        return true;
      }

      // Check if it's a group the user belongs to
      if (this.isUserInGroup(userId, item)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Reload users from disk (for testing or manual refresh)
   */
  reload(): void {
    this.loadUsers();
  }

  /**
   * Get all users (for admin purposes)
   */
  getAllUsers(): User[] {
    return Array.from(this.usersCache.values());
  }
}

// Singleton instance
let userManagerInstance: UserManager | null = null;

export function getUserManager(): UserManager {
  if (!userManagerInstance) {
    userManagerInstance = new UserManager();
  }
  return userManagerInstance;
}

// For testing: allow resetting the singleton
export function resetUserManager(): void {
  userManagerInstance = null;
}
