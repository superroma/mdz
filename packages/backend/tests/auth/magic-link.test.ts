import { afterEach, beforeEach, describe, expect, test } from "vitest";
import jwt from "jsonwebtoken";
import {
  mintMagicToken,
  verifyMagicToken,
  buildMagicLinkUrl,
} from "../../src/auth/magic-link.js";

const SECRET = "magic-test-secret";

beforeEach(() => {
  process.env.JWT_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.JWT_SECRET;
  delete process.env.MAGIC_LINK_TTL;
});

describe("magic-link token", () => {
  test("mints a token that verifies back to the same email", () => {
    const token = mintMagicToken("alice@example.com");
    expect(verifyMagicToken(token)).toEqual({ email: "alice@example.com" });
  });

  test("rejects a token whose purpose is not magic-link", () => {
    const sessionish = jwt.sign(
      { email: "alice@example.com", purpose: "session" },
      SECRET
    );
    expect(() => verifyMagicToken(sessionish)).toThrow();
  });

  test("rejects a session token that has no purpose at all", () => {
    const sessionish = jwt.sign(
      { email: "alice@example.com", provider: "magic", groups: ["everyone"] },
      SECRET
    );
    expect(() => verifyMagicToken(sessionish)).toThrow();
  });

  test("rejects an expired token", () => {
    const token = mintMagicToken("alice@example.com", { expiresIn: -10 });
    expect(() => verifyMagicToken(token)).toThrow();
  });

  test("rejects a token signed with a different secret", () => {
    const foreign = jwt.sign(
      { email: "alice@example.com", purpose: "magic-link" },
      "some-other-secret"
    );
    expect(() => verifyMagicToken(foreign)).toThrow();
  });

  test("rejects a tampered/garbage token", () => {
    expect(() => verifyMagicToken("not-a-real-token")).toThrow();
  });

  test("builds a magic-link URL pointing at the verify endpoint", () => {
    expect(buildMagicLinkUrl("https://site.example", "TOK123")).toBe(
      "https://site.example/api/auth/magic?token=TOK123"
    );
  });
});
