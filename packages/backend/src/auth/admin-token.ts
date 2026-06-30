import jwt from "jsonwebtoken";

// Mirrors auth/magic-link.ts's secret read so the CLI can sign standalone (no fastify).
function getSecret(): string {
  return process.env.JWT_SECRET || "dev-secret-change-in-production";
}

const DEFAULT_TTL = "45m";

export function getAdminTokenTtl(): string {
  return process.env.ADMIN_TOKEN_TTL || DEFAULT_TTL;
}

/**
 * Mint a short-lived `admins` SESSION token (not a magic-link). It carries
 * groups:["admins"] and NO `purpose`, so it passes the /api/admin/* guard.
 */
export function mintAdminToken(
  email: string,
  opts?: { expiresIn?: string | number }
): string {
  const payload = { email, provider: "magic", groups: ["admins"] };
  return jwt.sign(payload, getSecret(), {
    expiresIn: opts?.expiresIn ?? getAdminTokenTtl(),
  } as jwt.SignOptions);
}
