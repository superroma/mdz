import { existsSync, readdirSync, mkdirSync, renameSync, rmdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { validatePath, getPagesRoot } from "./path-validator.js";
import { ForbiddenError } from "../errors.js";

export function getPageFilePath(pagePath: string): string {
  const validation = validatePath(pagePath);
  if (!validation.valid) {
    throw new ForbiddenError(validation.error || "Invalid path");
  }
  
  const pagesRoot = getPagesRoot();
  const relativePath = pagePath.replace(/\.md$/, "");
  const validation2 = validatePath(relativePath);
  if (!validation2.valid) {
    throw new ForbiddenError(validation2.error || "Invalid path");
  }
  
  return validation2.resolvedPath + ".md";
}

export function getPageDirPath(pagePath: string): string {
  const validation = validatePath(pagePath);
  if (!validation.valid) {
    throw new ForbiddenError(validation.error || "Invalid path");
  }
  
  const relativePath = pagePath.replace(/\.md$/, "").replace(/\/README$/, "");
  const validation2 = validatePath(relativePath);
  if (!validation2.valid) {
    throw new ForbiddenError(validation2.error || "Invalid path");
  }
  
  return validation2.resolvedPath;
}

export function ensurePageFolderized(pagePath: string): void {
  const pagesRoot = getPagesRoot();
  const relativePath = pagePath.replace(/\.md$/, "");
  const validation = validatePath(relativePath);
  if (!validation.valid) {
    throw new ForbiddenError(validation.error || "Invalid path");
  }
  
  const singleFilePath = join(pagesRoot, `${relativePath}.md`);
  const folderPath = join(pagesRoot, relativePath);
  const readmePath = join(folderPath, "README.md");
  
  if (existsSync(singleFilePath) && !existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true });
    renameSync(singleFilePath, readmePath);
  }
}

export function checkShouldDefolderize(pagePath: string): boolean {
  const pagesRoot = getPagesRoot();
  const relativePath = pagePath.replace(/\.md$/, "").replace(/\/README$/, "");
  const validation = validatePath(relativePath);
  if (!validation.valid) {
    return false;
  }
  
  const folderPath = join(pagesRoot, relativePath);
  const readmePath = join(folderPath, "README.md");
  
  if (!existsSync(folderPath) || !existsSync(readmePath)) {
    return false;
  }
  
  const entries = readdirSync(folderPath);
  const childPages = entries.filter(
    (entry) => entry.endsWith(".md") && entry !== "README.md"
  );
  const attachments = entries.filter(
    (entry) => !entry.endsWith(".md")
  );
  
  return childPages.length === 0 && attachments.length === 0;
}

export function defolderizePage(pagePath: string): void {
  const pagesRoot = getPagesRoot();
  const relativePath = pagePath.replace(/\.md$/, "").replace(/\/README$/, "");
  const validation = validatePath(relativePath);
  if (!validation.valid) {
    throw new ForbiddenError(validation.error || "Invalid path");
  }
  
  const folderPath = join(pagesRoot, relativePath);
  const readmePath = join(folderPath, "README.md");
  const singleFilePath = join(pagesRoot, `${relativePath}.md`);
  
  if (existsSync(readmePath)) {
    renameSync(readmePath, singleFilePath);
    rmdirSync(folderPath);
  }
}

export function getPageTitleFromPath(pagePath: string): string {
  const parts = pagePath.split("/");
  const lastPart = parts[parts.length - 1];
  
  if (lastPart === "README.md" || lastPart === "README") {
    if (parts.length > 1) {
      return parts[parts.length - 2];
    }
    return "README";
  }
  
  return lastPart.replace(/\.md$/, "");
}

export function isChildPage(parentPath: string, childPath: string): boolean {
  const parentDir = parentPath.replace(/\.md$/, "").replace(/\/README$/, "");
  const childDir = dirname(childPath.replace(/\.md$/, ""));
  
  // Only match direct children (one level down), not all descendants
  return childDir === parentDir;
}

