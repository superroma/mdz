import fastify from "fastify";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { registerPageRoutes } from "./routes/pages.js";
import { registerFileRoutes } from "./routes/files.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { getPagesRoot, DEFAULT_PAGES_ROOT } from "./storage/path-validator.js";
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { AppError } from "./errors.js";

export const DEFAULT_PORT = 3001;

type TraversalFlaggedRequest = {
  __hasTraversal?: boolean;
  __invalidEncoding?: boolean;
};

export async function buildServer() {
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

  await app.register(multipart);
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

  if (process.env.NODE_ENV !== "production") {
    const { registerTestAuthPlugin } = await import("./dev/test-auth-plugin.js");
    await app.register(registerTestAuthPlugin);
    console.log("Test auth provider registered (development only)");
  }

  await registerAuthRoutes(app);
  await registerPageRoutes(app);
  await registerFileRoutes(app);

  // Serve static frontend files in production only
  if (process.env.NODE_ENV === "production") {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
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
  }

  return app;
}

async function start() {
  const server = await buildServer();

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
    server.log.error(error);
    process.exit(1);
  }
}

const isMainModule =
  process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  start();
}

