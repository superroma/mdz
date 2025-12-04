import { FastifyInstance } from "fastify";
import { listFiles, deleteFile, getFileStream } from "../storage/file-storage.js";
import { validatePathOrThrow, validateFilenameOrThrow, validateFileExtensionOrThrow } from "../storage/path-validator.js";
import { ensurePageFolderized } from "../storage/folderization.js";
import { readPage } from "../storage/page-storage.js";
import { createWriteStream, statSync } from "node:fs";
import { join, extname } from "node:path";
import { getPagesRoot } from "../storage/path-validator.js";
import { NotFoundError, ValidationError } from "../errors.js";
import { loadUsersConfig, checkPageAccess } from "../storage/user-access.js";

// MIME type mapping for common file types
const getMimeType = (filename: string): string => {
  const ext = extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Images
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".bmp": "image/bmp",
    // Documents
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".html": "text/html",
    ".htm": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".xml": "application/xml",
    // Office documents - Microsoft Office
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Office documents - OpenDocument
    ".odt": "application/vnd.oasis.opendocument.text",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    ".odp": "application/vnd.oasis.opendocument.presentation",
    // Other document formats
    ".rtf": "application/rtf",
    ".csv": "text/csv",
    // Archives
    ".zip": "application/zip",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  // Video
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

export async function registerFileRoutes(app: FastifyInstance) {
  app.get("/api/files/*", async (request, reply) => {
    const path = (request.params as { "*": string })["*"];
    const userGroups = request.currentUser?.groups || [];
    const pathParts = path.split("/");
    const lastSegment = pathParts.pop();
    const pagePath = pathParts.join("/");
    
    const hasFileExtension = lastSegment && /\.\w+$/.test(lastSegment);
    
    if (!lastSegment || !hasFileExtension) {
      validatePathOrThrow(path);
      
      const config = loadUsersConfig();
      if (!checkPageAccess(userGroups, path, "read", config)) {
        throw new NotFoundError("Page not found");
      }
      
      const files = listFiles(path);
      return { files };
    }
    
    validatePathOrThrow(pagePath);
    validateFilenameOrThrow(lastSegment);
    validateFileExtensionOrThrow(lastSegment);
    
    const config = loadUsersConfig();
    if (!checkPageAccess(userGroups, pagePath, "read", config)) {
      throw new NotFoundError("Page not found");
    }
    
    const fileStream = getFileStream(pagePath, lastSegment);
    const pagesRoot = getPagesRoot();
    const filePath = join(pagesRoot, pagePath.replace(/\.md$/, ""), lastSegment);
    const stats = statSync(filePath);
    const mimeType = getMimeType(lastSegment);
    
    const encodedFilename = encodeURIComponent(lastSegment).replace(/'/g, "%27");
    const contentDisposition = `inline; filename*=UTF-8''${encodedFilename}`;
    
    return reply
      .header("Content-Length", stats.size)
      .header("Content-Disposition", contentDisposition)
      .type(mimeType)
      .send(fileStream);
  });

  app.post("/api/files/*", async (request, reply) => {
    const path = (request.params as { "*": string })["*"];
    const userGroups = request.currentUser?.groups || [];
    
    validatePathOrThrow(path);
    
    const config = loadUsersConfig();
    if (!checkPageAccess(userGroups, path, "write", config)) {
      throw new NotFoundError("Page not found");
    }
    
    const page = readPage(path);
    if (!page) {
      throw new NotFoundError("Page not found");
    }
    
    ensurePageFolderized(path);
    
    const data = await request.file();
    if (!data) {
      throw new ValidationError("No file uploaded");
    }
    
    validateFilenameOrThrow(data.filename);
    validateFileExtensionOrThrow(data.filename);
    
    const pagesRoot = getPagesRoot();
    const relativePath = path.replace(/\.md$/, "");
    const folderPath = join(pagesRoot, relativePath);
    const filePath = join(folderPath, data.filename);
    
    const resolvedFilePath = validatePathOrThrow(relativePath + "/" + data.filename);
    if (!resolvedFilePath.startsWith(getPagesRoot())) {
      throw new ValidationError("Invalid file path");
    }
    
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      data.file.pipe(writeStream);
      
      writeStream.on("finish", () => {
        const stats = statSync(filePath);
        resolve(reply.code(201).send({
          name: data.filename,
          size: stats.size,
          uploadDate: new Date().toISOString()
        }));
      });
      
      writeStream.on("error", (error) => {
        reject(error);
      });
    });
  });

  app.delete("/api/files/*", async (request) => {
    const path = (request.params as { "*": string })["*"];
    const userGroups = request.currentUser?.groups || [];
    const pathParts = path.split("/");
    const filename = pathParts.pop();
    const pagePath = pathParts.join("/");
    
    if (!filename) {
      throw new ValidationError("Filename is required");
    }
    
    validatePathOrThrow(pagePath);
    validateFilenameOrThrow(filename);
    
    const config = loadUsersConfig();
    if (!checkPageAccess(userGroups, pagePath, "write", config)) {
      throw new NotFoundError("Page not found");
    }
    
    deleteFile(pagePath, filename);
  });
}

