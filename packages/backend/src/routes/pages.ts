import { FastifyInstance } from "fastify";
import { listPages, listPagesForUser, readPage, createPage, updatePage, renamePage, deletePage } from "../storage/page-storage.js";
import { validatePathOrThrow } from "../storage/path-validator.js";
import { NotFoundError, ValidationError } from "../errors.js";
import { requireAuth } from "../auth/jwt-middleware.js";
import { canRead, canWrite, canCreateChild } from "../auth/permissions.js";
import { dirname } from "node:path";

export async function registerPageRoutes(app: FastifyInstance) {
  // List all pages (filtered by user permissions)
  app.get("/api/pages", async (request, reply) => {
    requireAuth(request, reply);
    return listPagesForUser(request.user);
  });

  // Get a specific page
  app.get("/api/pages/*", async (request, reply) => {
    requireAuth(request, reply);
    const path = (request.params as { "*": string })["*"];
    validatePathOrThrow(path);
    
    // Check if user has read permission
    if (!canRead(request.user, path)) {
      throw new NotFoundError("Page not found");
    }
    
    const page = readPage(path);
    if (!page) {
      throw new NotFoundError("Page not found");
    }
    return page;
  });

  // Create a new page
  app.post("/api/pages", async (request, reply) => {
    requireAuth(request, reply);
    const body = request.body as { path?: string; content?: string; parent?: string };
    const pagePath = body.path || "Untitled";
    const content = body.content || "";
    
    let finalPath = pagePath;
    let parentPath = ".";
    
    if (body.parent) {
      validatePathOrThrow(body.parent);
      parentPath = body.parent;
      finalPath = `${body.parent}/${pagePath}`;
    } else {
      // If no parent specified, check if path has a parent directory
      const pathParent = dirname(pagePath);
      if (pathParent && pathParent !== ".") {
        parentPath = pathParent;
      }
    }
    
    // Check if user can create children under parent
    if (parentPath !== "." && !canCreateChild(request.user, parentPath)) {
      throw new NotFoundError("Page not found");
    }
    
    validatePathOrThrow(finalPath);
    const page = createPage(finalPath, content);
    return page;
  });

  // Update a page
  app.put("/api/pages/*", async (request, reply) => {
    requireAuth(request, reply);
    const path = (request.params as { "*": string })["*"];
    validatePathOrThrow(path);
    
    // Check if user has write permission
    if (!canWrite(request.user, path)) {
      throw new NotFoundError("Page not found");
    }
    
    const body = request.body as { content: string };
    
    if (typeof body.content !== "string") {
      throw new ValidationError("Content is required");
    }
    
    return updatePage(path, body.content);
  });

  // Rename a page
  app.patch("/api/pages/*", async (request, reply) => {
    requireAuth(request, reply);
    const path = (request.params as { "*": string })["*"];
    validatePathOrThrow(path);
    
    // Check if user has write permission on source
    if (!canWrite(request.user, path)) {
      throw new NotFoundError("Page not found");
    }
    
    const body = request.body as { newPath: string };
    
    if (!body.newPath || typeof body.newPath !== "string") {
      throw new ValidationError("newPath is required");
    }
    
    validatePathOrThrow(body.newPath);
    
    // Check if user has write permission on destination parent
    const newParent = dirname(body.newPath);
    if (newParent && newParent !== "." && !canCreateChild(request.user, newParent)) {
      throw new NotFoundError("Page not found");
    }
    
    return renamePage(path, body.newPath);
  });

  // Delete a page
  app.delete("/api/pages/*", async (request, reply) => {
    requireAuth(request, reply);
    const path = (request.params as { "*": string })["*"];
    validatePathOrThrow(path);
    
    // Check if user has write permission
    if (!canWrite(request.user, path)) {
      throw new NotFoundError("Page not found");
    }
    
    deletePage(path);
  });
}

