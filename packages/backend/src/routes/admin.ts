import { FastifyInstance, FastifyRequest } from "fastify";
import {
  loadUsersConfig,
  upsertUser,
  removeUser,
  listUsers,
} from "../storage/user-access.js";
import { mintMagicToken, buildMagicLinkUrl } from "../auth/magic-link.js";
import { getBackendUrl } from "./auth.js";

interface SessionClaims {
  email?: string;
  name?: string;
  provider?: string;
  groups?: string[];
  purpose?: string;
}

function extractToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return request.cookies?.auth_token;
}

function paramEmail(request: FastifyRequest): string {
  return decodeURIComponent((request.params as { email: string }).email);
}

/**
 * Admin API (admins-group only). Called by nanoclaw's admin agent or the CLI to
 * manage membership and mint onboarding links. All mutations go through the
 * users.yaml write store; magic links are minted stateless.
 */
export async function registerAdminRoutes(app: FastifyInstance) {
  // Guard scoped to /api/admin. Fail-closed: unauthenticated -> 401,
  // authenticated-but-not-admin -> 404 (hide the API's existence, matching the
  // page routes' info-leak avoidance).
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/admin")) {
      return;
    }

    const token = extractToken(request);
    if (!token) {
      reply.status(401).send({ error: "Unauthorized" });
      return;
    }

    let decoded: SessionClaims;
    try {
      decoded = app.jwt.verify(token) as SessionClaims;
    } catch {
      reply.status(401).send({ error: "Invalid token" });
      return;
    }

    // A magic-link bootstrap token is not a session and must be exchanged first.
    if (decoded.purpose === "magic-link") {
      reply.status(401).send({ error: "Invalid token" });
      return;
    }

    const groups = decoded.groups || [];
    if (!groups.includes("admins")) {
      reply.status(404).send({ error: "Not Found" });
      return;
    }

    request.currentUser = {
      email: decoded.email || "",
      name: decoded.name || "",
      provider: decoded.provider || "",
      groups,
    };
  });

  app.get("/api/admin/users", async () => {
    return { users: listUsers() };
  });

  // addUser: upsert membership + mint a magic link for the new member.
  app.post("/api/admin/users", async (request, reply) => {
    const { email, groups } = (request.body || {}) as {
      email?: string;
      groups?: string[];
    };
    if (!email) {
      reply.status(400).send({ error: "email is required" });
      return;
    }
    upsertUser(email, groups ?? []);
    const magicLinkUrl = buildMagicLinkUrl(
      getBackendUrl(request),
      mintMagicToken(email)
    );
    return { email, groups: groups ?? [], magicLinkUrl };
  });

  // mintMagicLink: fresh link for an existing member (the "returning login" path).
  app.post("/api/admin/users/:email/magic-link", async (request, reply) => {
    const email = paramEmail(request);
    if (!loadUsersConfig().users[email]) {
      reply.status(404).send({ error: "User not found" });
      return;
    }
    const magicLinkUrl = buildMagicLinkUrl(
      getBackendUrl(request),
      mintMagicToken(email)
    );
    return { email, magicLinkUrl };
  });

  // setGroups: update an existing member's groups.
  app.put("/api/admin/users/:email", async (request, reply) => {
    const email = paramEmail(request);
    const { groups } = (request.body || {}) as { groups?: string[] };
    if (!loadUsersConfig().users[email]) {
      reply.status(404).send({ error: "User not found" });
      return;
    }
    upsertUser(email, groups ?? []);
    return { email, groups: groups ?? [] };
  });

  // removeUser: revoke membership (kills any outstanding link via group resolution).
  app.delete("/api/admin/users/:email", async (request, reply) => {
    const email = paramEmail(request);
    if (!removeUser(email)) {
      reply.status(404).send({ error: "User not found" });
      return;
    }
    return { email, removed: true };
  });
}
