import { FastifyInstance } from "fastify";
import { listPages, readPage, createPage, updatePage, renamePage, deletePage } from "../storage/page-storage.js";
import { validatePathOrThrow } from "../storage/path-validator.js";
import { NotFoundError, ValidationError } from "../errors.js";

export async function registerPageRoutes(app: FastifyInstance) {
  app.get("/api/pages", async () => {
    return listPages();
  });

  app.get("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    validatePathOrThrow(path);
    const page = readPage(path);
    if (!page) {
      throw new NotFoundError("Page not found");
    }
    return page;
  });

  app.post("/api/pages", async (request) => {
    const body = request.body as { path?: string; content?: string; parent?: string };
    const pagePath = body.path || "Untitled";
    const content = body.content || "";
    
    let finalPath = pagePath;
    if (body.parent) {
      validatePathOrThrow(body.parent);
      finalPath = `${body.parent}/${pagePath}`;
    }
    
    validatePathOrThrow(finalPath);
    const page = createPage(finalPath, content);
    return page;
  });

  app.put("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    validatePathOrThrow(path);
    
    const body = request.body as { content: string };
    
    if (typeof body.content !== "string") {
      throw new ValidationError("Content is required");
    }
    
    return updatePage(path, body.content);
  });

  app.patch("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    validatePathOrThrow(path);
    
    const body = request.body as { newPath: string };
    
    if (!body.newPath || typeof body.newPath !== "string") {
      throw new ValidationError("newPath is required");
    }
    
    validatePathOrThrow(body.newPath);
    return renamePage(path, body.newPath);
  });

  app.delete("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    validatePathOrThrow(path);
    deletePage(path);
  });
}

