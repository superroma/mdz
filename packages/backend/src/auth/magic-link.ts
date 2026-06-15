import jwt from "jsonwebtoken";

/**
 * Magic-link auth tokens are short-lived, identity-bound, single-purpose JWTs.
 *
 * They are signed with the same `JWT_SECRET` as session tokens but carry a
 * `purpose: "magic-link"` claim so they can never be mistaken for — or replayed
 * as — a session token (and vice-versa). They carry no groups: a magic-link
 * proves identity only and must be exchanged at the verify endpoint, which
 * resolves the caller's groups from `users.yaml` at click time.
 *
 * They are stateless and replayable within their (short) TTL — there is no
 * server-side token store. See docs/superpowers/specs/2026-06-15-magic-link-auth-design.md.
 */

export const MAGIC_LINK_PURPOSE = "magic-link";

/** Default lifetime of a magic-link; overridable via MAGIC_LINK_TTL (any `ms`/jsonwebtoken span, e.g. "2h", "30m"). */
const DEFAULT_TTL = "2h";

function getSecret(): string {
  return process.env.JWT_SECRET || "dev-secret-change-in-production";
}

export function getMagicLinkTtl(): string {
  return process.env.MAGIC_LINK_TTL || DEFAULT_TTL;
}

interface MagicLinkClaims {
  email: string;
  purpose: typeof MAGIC_LINK_PURPOSE;
}

/** Mint a signed magic-link token bound to `email`. */
export function mintMagicToken(
  email: string,
  opts?: { expiresIn?: string | number }
): string {
  const payload: MagicLinkClaims = { email, purpose: MAGIC_LINK_PURPOSE };
  return jwt.sign(payload, getSecret(), {
    expiresIn: opts?.expiresIn ?? getMagicLinkTtl(),
  } as jwt.SignOptions);
}

/**
 * Verify a magic-link token. Throws if the signature is invalid, the token is
 * expired, or the `purpose` claim is anything other than "magic-link".
 * Returns the bound email on success.
 */
export function verifyMagicToken(token: string): { email: string } {
  const decoded = jwt.verify(token, getSecret()) as Partial<MagicLinkClaims>;
  if (decoded.purpose !== MAGIC_LINK_PURPOSE || !decoded.email) {
    throw new Error("Not a magic-link token");
  }
  return { email: decoded.email };
}

/** Render the clickable magic-link URL for a token against a backend base URL. */
export function buildMagicLinkUrl(baseUrl: string, token: string): string {
  const url = new URL("/api/auth/magic", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}
