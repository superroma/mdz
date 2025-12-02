import dotenv from "dotenv";
import fastify from "fastify";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import cookie from "@fastify/cookie";
import { registerPageRoutes } from "./routes/pages.js";
import { registerFileRoutes } from "./routes/files.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { getPagesRoot, DEFAULT_PAGES_ROOT } from "./storage/path-validator.js";
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { AppError } from "./errors.js";
import { FastifyInstance, FastifyRequest } from "fastify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../../.env") });

export const DEFAULT_PORT = 3001;

declare module "fastify" {
  interface FastifyRequest {
    currentUser?: {
      email: string;
      name: string;
      provider: string;
      groups: string[];
    };
  }
}

type TraversalFlaggedRequest = {
  __hasTraversal?: boolean;
  __invalidEncoding?: boolean;
};

export async function buildServer(registerExtraPlugins?: (app: any) => Promise<void>) {
  const app = fastify({
    rewriteUrl: (req) => {
      const rawUrl = req.url ?? "";
      try {
        const decoded = decodeURIComponent(rawUrl);
        const pathOnly = decoded.split("?")[0] ?? "";
        const segments = pathOnly.split("/").filter(Boolean);
        if (segments.includes("..")) {
          (req as TraversalFlaggedRequest).__hasTraversal = true;
        }
      } catch {
        (req as TraversalFlaggedRequest).__invalidEncoding = true;
      }
      return req.url ?? rawUrl;
    }
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });
  await app.register(cookie);
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  // Early rejection hook for path traversal
  app.addHook("onRequest", (request, reply, done) => {
    const raw = request.raw as TraversalFlaggedRequest & { url?: string };
    if (!raw.url || !raw.url.startsWith("/api/")) {
      done();
      return;
    }

    if (raw.__invalidEncoding) {
      reply.status(400).send({ error: "Invalid URL encoding" });
      return;
    }

    if (raw.__hasTraversal) {
      reply.status(403).send({ error: "Path traversal attempt detected" });
      return;
    }

    done();
  });

  // Centralized error handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ error: error.message });
      return;
    }

    request.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  });

  const pagesRoot = getPagesRoot();
  if (!existsSync(pagesRoot)) {
    mkdirSync(pagesRoot, { recursive: true });
  }

  app.get("/api/health", async () => ({
    status: "ok",
    pagesRoot: process.env.PAGES_ROOT ?? DEFAULT_PAGES_ROOT
  }));

  // Register extra plugins before auth routes (e.g., test-auth-plugin)
  if (registerExtraPlugins) {
    await registerExtraPlugins(app);
  }

  await registerAuthRoutes(app);

  app.addHook("onRequest", async (request, reply) => {
    const url = request.url;
    
    if (!url.startsWith("/api/pages") && !url.startsWith("/api/files")) {
      return;
    }
    
    if (process.env.NODE_ENV === "test") {
      request.currentUser = {
        email: "admin@test.local",
        name: "Test Admin",
        provider: "test",
        groups: ["everyone", "admins"],
      };
      return;
    }
    
    let token: string | undefined;
    
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.auth_token;
    }
    
    if (!token) {
      reply.status(401).send({ error: "Unauthorized" });
      return;
    }
    
    try {
      const decoded = app.jwt.verify(token) as {
        email: string;
        name: string;
        provider: string;
        groups: string[];
      };
      
      request.currentUser = {
        email: decoded.email,
        name: decoded.name,
        provider: decoded.provider,
        groups: decoded.groups || [],
      };
    } catch (error) {
      reply.status(401).send({ error: "Invalid token" });
      return;
    }
  });

  await registerPageRoutes(app);
  await registerFileRoutes(app);

  const frontendDistPath = join(__dirname, "../../frontend/dist");
  
  if (existsSync(frontendDistPath)) {
    await app.register(fastifyStatic, {
      root: frontendDistPath,
      prefix: "/",
    });

    // Fallback to index.html for client-side routing
    app.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith("/api/")) {
        reply.sendFile("index.html");
      } else {
        reply.status(404).send({ error: "Not Found" });
      }
    });
  }

  return app;
}

export async function startServer(server: FastifyInstance) {
  const port = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
  const host = process.env.HOST ?? "0.0.0.0";
  const pagesRootEnv = process.env.PAGES_ROOT ?? DEFAULT_PAGES_ROOT;
  const pagesRootAbsolute = getPagesRoot();

  try {
    await server.listen({ port, host });
    console.log(`Backend listening on http://${host}:${port}`);
    console.log(`PAGES_ROOT: ${pagesRootAbsolute}`);
    server.log.info(`Backend listening on http://${host}:${port}`);
    server.log.info(`PAGES_ROOT (env): ${pagesRootEnv}`);
    server.log.info(`PAGES_ROOT (absolute): ${pagesRootAbsolute}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    server.log.error(error);
    process.exit(1);
  }
}
