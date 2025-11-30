import { FastifyInstance } from "fastify";
import { listPages, readPage, createPage, updatePage, renamePage, deletePage } from "../storage/page-storage.js";
import { validatePathOrThrow } from "../storage/path-validator.js";
import { NotFoundError, ValidationError } from "../errors.js";
import { loadUsersConfig, checkPageAccess } from "../storage/user-access.js";

export async function registerPageRoutes(app: FastifyInstance) {
  app.get("/api/pages", async (request) => {
    const userGroups = request.currentUser?.groups || [];
    const pages = listPages(userGroups);
    return pages;
  });

  app.get("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    const userGroups = request.currentUser?.groups || [];
    
    validatePathOrThrow(path);
    
    const config = loadUsersConfig();
    if (!checkPageAccess(userGroups, path, "read", config)) {
      throw new NotFoundError("Page not found");
    }
    
    const page = readPage(path);
    if (!page) {
      throw new NotFoundError("Page not found");
    }
    return page;
  });

  app.post("/api/pages", async (request) => {
    const body = request.body as { path?: string; content?: string; parent?: string };
    const userGroups = request.currentUser?.groups || [];
    const pagePath = body.path || "Untitled";
    const content = body.content || "";
    
    const config = loadUsersConfig();
    
    let finalPath = pagePath;
    if (body.parent) {
      validatePathOrThrow(body.parent);
      
      if (!checkPageAccess(userGroups, body.parent, "write", config)) {
        throw new NotFoundError("Page not found");
      }
      
      finalPath = `${body.parent}/${pagePath}`;
    } else {
      if (userGroups.length === 0 || (!userGroups.includes("admins") && !config.defaultAccess.write.some(g => userGroups.includes(g)))) {
        throw new NotFoundError("Page not found");
      }
    }
    
    validatePathOrThrow(finalPath);
    const page = createPage(finalPath, content);
    return page;
  });

  app.put("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    const userGroups = request.currentUser?.groups || [];
    
    validatePathOrThrow(path);
    
    const config = loadUsersConfig();
    if (!checkPageAccess(userGroups, path, "write", config)) {
      throw new NotFoundError("Page not found");
    }
    
    const body = request.body as { content: string };
    
    if (typeof body.content !== "string") {
      throw new ValidationError("Content is required");
    }
    
    return updatePage(path, body.content);
  });

  app.patch("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    const userGroups = request.currentUser?.groups || [];
    
    validatePathOrThrow(path);
    
    const config = loadUsersConfig();
    if (!checkPageAccess(userGroups, path, "write", config)) {
      throw new NotFoundError("Page not found");
    }
    
    const body = request.body as { newPath: string };
    
    if (!body.newPath || typeof body.newPath !== "string") {
      throw new ValidationError("newPath is required");
    }
    
    validatePathOrThrow(body.newPath);
    return renamePage(path, body.newPath);
  });

  app.delete("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    const userGroups = request.currentUser?.groups || [];
    
    validatePathOrThrow(path);
    
    const config = loadUsersConfig();
    if (!checkPageAccess(userGroups, path, "write", config)) {
      throw new NotFoundError("Page not found");
    }
    
    deletePage(path);
  });
}

