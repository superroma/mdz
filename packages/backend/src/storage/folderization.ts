import { existsSync, readdirSync, mkdirSync, renameSync, rmdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
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
  
  // Use the resolved path from validation to ensure correct path handling
  const resolvedPath = validation.resolvedPath;
  const singleFilePath = `${resolvedPath}.md`;
  const folderPath = resolvedPath;
  const readmePath = join(folderPath, "README.md");
  
  const singleFileExists = existsSync(singleFilePath);
  const folderExists = existsSync(folderPath);
  
  console.log(`[ensurePageFolderized] pagePath="${pagePath}", relativePath="${relativePath}"`);
  console.log(`[ensurePageFolderized] resolvedPath="${resolvedPath}"`);
  console.log(`[ensurePageFolderized] singleFileExists=${singleFileExists}, folderExists=${folderExists}`);
  
  if (singleFileExists && !folderExists) {
    console.log(`[ensurePageFolderized] CONVERTING: ${singleFilePath} -> ${readmePath}`);
    mkdirSync(folderPath, { recursive: true });
    renameSync(singleFilePath, readmePath);
    console.log(`[ensurePageFolderized] CONVERSION COMPLETE`);
  } else {
    console.log(`[ensurePageFolderized] SKIPPED: singleFileExists=${singleFileExists}, folderExists=${folderExists}`);
  }
}

export function checkShouldDefolderize(pagePath: string): boolean {
  const relativePath = pagePath.replace(/\.md$/, "").replace(/\/README$/, "");
  const validation = validatePath(relativePath);
  if (!validation.valid) {
    return false;
  }
  
  // Use the resolved path from validation to ensure correct path handling
  const folderPath = validation.resolvedPath;
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
  
  // Use the resolved path from validation to ensure correct path handling
  const folderPath = validation.resolvedPath;
  const readmePath = join(folderPath, "README.md");
  // For the single file path, we need to construct it relative to pagesRoot
  // Get the relative path from pagesRoot to the folder, then append .md
  const relativeToRoot = relative(pagesRoot, folderPath);
  const singleFilePath = join(pagesRoot, `${relativeToRoot}.md`);
  
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

