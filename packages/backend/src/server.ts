import fastify from "fastify";
import { fileURLToPath } from "node:url";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { registerPageRoutes } from "./routes/pages";
import { registerFileRoutes } from "./routes/files";
import { getPagesRoot } from "./storage/path-validator";
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { AppError } from "./errors";

export const DEFAULT_PORT = 3001;
export const DEFAULT_PAGES_ROOT = "pages";

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

  await registerPageRoutes(app);
  await registerFileRoutes(app);

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
    console.log(`PAGES_ROOT (env): ${pagesRootEnv}`);
    console.log(`PAGES_ROOT (absolute): ${pagesRootAbsolute}`);
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

