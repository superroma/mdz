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
};
