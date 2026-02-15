import { FastifyInstance } from "fastify";
import { listPages, readPage, createPage, updatePage, renamePage, deletePage } from "../storage/page-storage.js";
import { validatePathOrThrow } from "../storage/path-validator.js";
import { NotFoundError, ValidationError } from "../errors.js";
import { loadUsersConfig, checkPageAccess } from "../storage/user-access.js";
import { cleanAndSaveOrder } from "../storage/page-order.js";

export async function registerPageRoutes(app: FastifyInstance) {
  app.get("/api/pages", async (request) => {
    const userGroups = request.currentUser?.groups || [];
    const config = loadUsersConfig();
    const pages = listPages(userGroups);
    return pages.map((page) => ({
      ...page,
      canEdit: checkPageAccess(userGroups, page.path, "write", config),
    }));
  });

  app.get("/api/pages/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    const userGroups = request.currentUser?.groups || [];
    
    validatePathOrThrow(path);
    
    const config = loadUsersConfig();
    const canRead = checkPageAccess(userGroups, path, "read", config);
    console.log(`[Pages] GET /api/pages/${path} → user=${request.currentUser?.email}, groups=[${userGroups.join(', ')}], canRead=${canRead}`);
    if (!canRead) {
      throw new NotFoundError("Page not found");
    }
    
    const page = readPage(path);
    if (!page) {
      throw new NotFoundError("Page not found");
    }
    const canEdit = checkPageAccess(userGroups, path, "write", config);
    console.log(`[Pages] GET /api/pages/${path} → canEdit=${canEdit}`);
    return {
      ...page,
      canEdit,
    };
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
    return {
      ...page,
      canEdit: checkPageAccess(userGroups, page.path, "write", config),
    };
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
    
    const page = updatePage(path, body.content);
    return {
      ...page,
      canEdit: checkPageAccess(userGroups, page.path, "write", config),
    };
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
    const page = renamePage(path, body.newPath);
    return {
      ...page,
      canEdit: checkPageAccess(userGroups, page.path, "write", config),
    };
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

  app.put("/api/pages-order", async (request) => {
    const body = request.body as { parent: string | null; order: string[] };
    const userGroups = request.currentUser?.groups || [];
    
    if (!Array.isArray(body.order)) {
      throw new ValidationError("order must be an array");
    }
    
    const config = loadUsersConfig();
    
    if (body.parent) {
      validatePathOrThrow(body.parent);
      if (!checkPageAccess(userGroups, body.parent, "write", config)) {
        throw new NotFoundError("Page not found");
      }
    } else {
      if (userGroups.length === 0 || (!userGroups.includes("admins") && !config.defaultAccess.write.some(g => userGroups.includes(g)))) {
        throw new NotFoundError("Access denied");
      }
    }
    
    const allPages = listPages(userGroups);
    cleanAndSaveOrder(body.parent, body.order, allPages);
    
    return { success: true };
  });
}

