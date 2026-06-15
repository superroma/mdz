import { afterEach, beforeEach, describe, expect, test } from "vitest";
import jwt from "jsonwebtoken";
import { buildServer } from "../../src/mdz-server.js";
import { mintMagicToken } from "../../src/auth/magic-link.js";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SECRET = "magic-endpoint-secret";

let app: Awaited<ReturnType<typeof buildServer>>;
let testDir: string;

function createUsersYaml() {
  const settingsDir = join(testDir, ".settings");
  mkdirSync(settingsDir, { recursive: true });
  writeFileSync(
    join(settingsDir, "users.yaml"),
    `defaultAccess:
  read: [everyone]
  write: [writers]

users:
  writer@test.local:
    groups: [writers]
`
  );
}

function tokenFromRedirect(location: string): string | null {
  return new URL(location, "http://localhost").searchParams.get("token");
}

beforeEach(async () => {
  testDir = mkdtempSync(join(tmpdir(), "magic-endpoint-test-"));
  process.env.PAGES_ROOT = testDir;
  process.env.NODE_ENV = "development";
  process.env.JWT_SECRET = SECRET;
  app = await buildServer();
  createUsersYaml();
});

afterEach(async () => {
  await app.close();
  rmSync(testDir, { recursive: true, force: true });
  delete process.env.PAGES_ROOT;
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
});

describe("GET /api/auth/magic", () => {
  test("a valid magic link issues a session and redirects to /auth/callback", async () => {
    const token = mintMagicToken("writer@test.local");

    const response = await app.inject({
      method: "GET",
      url: `/api/auth/magic?token=${encodeURIComponent(token)}`,
    });

    expect(response.statusCode).toBe(302);
    const location = response.headers.location as string;
    expect(location.startsWith("/auth/callback?token=")).toBe(true);

    const sessionToken = tokenFromRedirect(location)!;
    const session = jwt.verify(sessionToken, SECRET) as {
      email: string;
      provider: string;
      groups: string[];
      purpose?: string;
    };
    expect(session.email).toBe("writer@test.local");
    expect(session.provider).toBe("magic");
    expect(session.groups).toEqual(
      expect.arrayContaining(["everyone", "writers"])
    );
    expect(session.purpose).toBeUndefined();

    const cookie = response.cookies.find((c) => c.name === "auth_token");
    expect(cookie?.value).toBe(sessionToken);
  });

  test("an expired magic link redirects to /login?error=expired-link", async () => {
    const token = mintMagicToken("writer@test.local", { expiresIn: -10 });

    const response = await app.inject({
      method: "GET",
      url: `/api/auth/magic?token=${encodeURIComponent(token)}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login?error=expired-link");
  });

  test("a missing token redirects to /login?error=expired-link", async () => {
    const response = await app.inject({ method: "GET", url: "/api/auth/magic" });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login?error=expired-link");
  });

  test("a non-member redirects to /login?error=no-access", async () => {
    const token = mintMagicToken("stranger@test.local");

    const response = await app.inject({
      method: "GET",
      url: `/api/auth/magic?token=${encodeURIComponent(token)}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login?error=no-access");
  });

  test("a session-shaped token (no magic-link purpose) is rejected", async () => {
    const sessionish = jwt.sign(
      { email: "writer@test.local", provider: "magic", groups: ["writers"] },
      SECRET
    );

    const response = await app.inject({
      method: "GET",
      url: `/api/auth/magic?token=${encodeURIComponent(sessionish)}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login?error=expired-link");
  });
});
