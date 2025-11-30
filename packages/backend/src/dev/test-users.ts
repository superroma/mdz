import jsonwebtoken from "jsonwebtoken";
import { loadUsersConfig, calculateUserGroups } from "../storage/user-access.js";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    id: "test-admin",
    email: "admin@test.local",
    name: "Test Admin",
    roles: ["admin"],
  },
  writer: {
    id: "test-writer",
    email: "writer@test.local",
    name: "Test Writer",
    roles: ["writer"],
  },
  reader: {
    id: "test-reader",
    email: "reader@test.local",
    name: "Test Reader",
    roles: ["reader"],
  },
  outsider: {
    id: "test-outsider",
    email: "non-user@test.local",
    name: "Unknown User",
    roles: [],
  },
};

export function generateTestUserJWT(role: string, jwtSecret: string): string {
  const user = TEST_USERS[role];
  if (!user) {
    throw new Error(`Unknown test user role: ${role}`);
  }

  const usersConfig = loadUsersConfig();
  const groups = calculateUserGroups(user.email, usersConfig);

  return jsonwebtoken.sign(
    {
      email: user.email,
      name: user.name,
      provider: "test",
      groups,
    },
    jwtSecret
  );
}
