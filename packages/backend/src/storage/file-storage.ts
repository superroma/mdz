import {
  existsSync,
  readdirSync,
  statSync,
  unlinkSync,
  createReadStream,
} from "node:fs";
import { join } from "node:path";
import { validatePath, validateFilename, getPagesRoot } from "./path-validator.js";
import { ensurePageFolderized } from "./folderization.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../errors.js";

export interface FileInfo {
  name: string;
  size: number;
  uploadDate: string;
}

export function listFiles(pagePath: string): FileInfo[] {
  const pagesRoot = getPagesRoot();
  const relativePath = pagePath.replace(/\.md$/, "");
  const validation = validatePath(relativePath);

  if (!validation.valid) {
    throw new ForbiddenError(validation.error || "Invalid path");
  }

  const folderPath = join(pagesRoot, relativePath);
  const singleFilePath = join(pagesRoot, `${relativePath}.md`);

  let dirPath: string;
  if (existsSync(folderPath)) {
    dirPath = folderPath;
  } else if (existsSync(singleFilePath)) {
    return [];
  } else {
    return [];
  }

  const entries = readdirSync(dirPath);
  const files: FileInfo[] = [];

  for (const entry of entries) {
    // Skip README.md, other .md files, and hidden files (starting with .)
    if (
      entry === "README.md" ||
      entry.endsWith(".md") ||
      entry.startsWith(".")
    ) {
      continue;
    }

    const filePath = join(dirPath, entry);
    const stats = statSync(filePath);

    if (stats.isFile()) {
      files.push({
        name: entry,
        size: stats.size,
        uploadDate: stats.birthtime.toISOString(),
      });
    }
  }

  return files;
}

export function getFilePath(pagePath: string, filename: string): string {
  const relativePath = pagePath.replace(/\.md$/, "");
  const validation = validatePath(relativePath);

  if (!validation.valid) {
    throw new ForbiddenError(validation.error || "Invalid path");
  }

  const filenameValidation = validateFilename(filename);
  if (!filenameValidation.valid) {
    throw new ValidationError(filenameValidation.error || "Invalid filename");
  }

  const pagesRoot = getPagesRoot();
  const folderPath = join(pagesRoot, relativePath);
  const singleFilePath = join(pagesRoot, `${relativePath}.md`);

  let dirPath: string;
  if (existsSync(folderPath)) {
    dirPath = folderPath;
  } else if (existsSync(singleFilePath)) {
    ensurePageFolderized(relativePath);
    dirPath = join(pagesRoot, relativePath);
  } else {
    throw new NotFoundError("Page not found");
  }

  const filePath = join(dirPath, filename);

  const filePathValidation = validatePath(relativePath + "/" + filename);
  if (
    !filePathValidation.valid ||
    !filePathValidation.resolvedPath.startsWith(getPagesRoot())
  ) {
    throw new ForbiddenError("Invalid file path");
  }

  if (!existsSync(filePath)) {
    throw new NotFoundError("File not found");
  }

  return filePath;
}

export function deleteFile(pagePath: string, filename: string): void {
  const filePath = getFilePath(pagePath, filename);
  unlinkSync(filePath);
}

export function getFileStream(
  pagePath: string,
  filename: string
): NodeJS.ReadableStream {
  const filePath = getFilePath(pagePath, filename);
  return createReadStream(filePath);
}
