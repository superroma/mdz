import { describe, expect, it, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { mintAdminToken, getAdminTokenTtl } from "../../src/auth/admin-token.js";

describe("mintAdminToken", () => {
  const OLD = process.env;
  beforeEach(() => { process.env = { ...OLD, JWT_SECRET: "test-secret" }; });
  afterEach(() => { process.env = OLD; });

  it("mints a token that passes the admin guard's conditions", () => {
    const token = mintAdminToken("agent-admin@demo.example.com");
    const decoded = jwt.verify(token, "test-secret") as any;
    expect(decoded.groups).toContain("admins");
    expect(decoded.provider).toBe("magic");
    expect(decoded.email).toBe("agent-admin@demo.example.com");
    expect(decoded.purpose).toBeUndefined();      // must NOT be a magic-link token
    expect(typeof decoded.exp).toBe("number");    // expiry IS set
  });

  it("defaults to a 45m TTL and honors ADMIN_TOKEN_TTL", () => {
    expect(getAdminTokenTtl()).toBe("45m");
    process.env.ADMIN_TOKEN_TTL = "10m";
    expect(getAdminTokenTtl()).toBe("10m");
  });

  it("rejects after expiry", () => {
    const token = mintAdminToken("agent-admin@demo.example.com", { expiresIn: -1 });
    expect(() => jwt.verify(token, "test-secret")).toThrow(/expired/i);
  });
});
