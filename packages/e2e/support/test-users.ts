export interface TestUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  groups: string[];
}

export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    id: "test-admin",
    email: "admin@test.local",
    name: "Test Admin",
    roles: ["admin"],
    groups: ["everyone", "admins"],
  },
  writer: {
    id: "test-writer",
    email: "writer@test.local",
    name: "Test Writer",
    roles: ["writer"],
    groups: ["everyone", "writers"],
  },
  reader: {
    id: "test-reader",
    email: "reader@test.local",
    name: "Test Reader",
    roles: ["reader"],
    groups: ["everyone"],
  },
};
