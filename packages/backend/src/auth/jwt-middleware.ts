import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { getUserManager } from "./user-manager.js";

export interface JWTPayload {
  sub: string;        // Google user ID
  email?: string;
  email_verified?: boolean;
  name?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  groups: string[];
  isAdmin: boolean;
}

// Extend Fastify request type to include user
declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Extract JWT from Authorization header
 */
function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer TOKEN" and just "TOKEN"
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

/**
 * Verify JWT token
 * In production, you would verify against Google's public keys
 * For development, we'll decode without verification if JWT_SECRET is not set
 */
function verifyToken(token: string): JWTPayload {
  const jwtSecret = process.env.JWT_SECRET;

  if (jwtSecret) {
    // Verify with secret (for testing/development with signed tokens)
    try {
      return jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  } else {
    // In development mode without JWT_SECRET, just decode without verification
    // WARNING: This is ONLY for development/testing
    console.warn("JWT_SECRET not set - decoding token without verification (INSECURE)");
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.sub) {
        throw new Error("Invalid token structure");
      }
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}

/**
 * Authenticate request and attach user to request object
 * Returns true if authenticated, false otherwise
 */
export function authenticateRequest(request: FastifyRequest): boolean {
  // Check if authentication is disabled for testing
  if (process.env.DISABLE_AUTH === "true") {
    // Use test user if provided, otherwise default admin
    const testUserId = process.env.TEST_USER_ID || "103234567890123456789";
    const userManager = getUserManager();
    const user = userManager.getUserById(testUserId);
    
    request.user = {
      id: testUserId,
      email: user?.email || "test@example.com",
      name: user?.name || "Test User",
      groups: user?.groups || ["admins"],
      isAdmin: user ? userManager.isAdmin(testUserId) : true
    };
    return true;
  }

  // Extract and verify JWT
  const token = extractToken(request);
  if (!token) {
    return false;
  }

  try {
    const payload = verifyToken(token);
    const userId = payload.sub;

    // Get user from user manager
    const userManager = getUserManager();
    const user = userManager.getUserById(userId);

    // Even if user is not in users.yaml, we create a minimal user object
    // This allows authenticated users not in the config to access public pages
    request.user = {
      id: userId,
      email: payload.email || user?.email,
      name: payload.name || user?.name,
      groups: user?.groups || [],
      isAdmin: user ? userManager.isAdmin(userId) : false
    };

    return true;
  } catch (error) {
    console.warn("JWT verification failed:", error);
    return false;
  }
}

/**
 * Fastify hook to authenticate all requests
 * Does NOT reject unauthenticated requests - just sets request.user
 * Individual routes can decide whether to require authentication
 */
export async function authenticationHook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  authenticateRequest(request);
  // Don't reject here - let individual routes handle it
}

/**
 * Require authentication for a route
 * Call this at the start of route handlers that need authentication
 */
export function requireAuth(request: FastifyRequest, reply: FastifyReply): void {
  if (!request.user) {
    reply.status(404).send({ error: "Not Found" });
    throw new Error("Authentication required");
  }
}
