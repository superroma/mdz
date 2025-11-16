import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync, mkdirSync, renameSync, rmdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { validatePath, getPagesRoot } from "./path-validator.js";
import { parseFrontMatter, serializeFrontMatter, FrontMatter } from "./front-matter.js";
import {
  ensurePageFolderized,
  checkShouldDefolderize,
  defolderizePage,
  getPageTitleFromPath,
  isChildPage
} from "./folderization.js";
import { NotFoundError, ValidationError } from "../errors.js";

export interface Page {
  path: string;
  title: string;
  content: string;
  frontMatter: FrontMatter;
  children: string[];
  parent?: string;
  isHidden?: boolean;
  isMarkdown?: boolean;
}

function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function getAllPagePathsRecursive(dir: string, basePath: string = ""): string[] {
  const paths: string[] = [];
  const pagesRoot = getPagesRoot();
  
  if (!existsSync(dir)) {
    return paths;
  }
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      const readmePath = join(fullPath, "README.md");
      if (existsSync(readmePath)) {
        paths.push(relativePath.replace(/\/README\.md$/, ""));
      }
      
      const childPaths = getAllPagePathsRecursive(fullPath, relativePath);
      paths.push(...childPaths);
    } else if (entry.isFile()) {
      // Include all files, not just .md files
      if (entry.name.endsWith(".md") && entry.name !== "README.md") {
        // Markdown files - remove .md extension
        paths.push(relativePath.replace(/\.md$/, ""));
      } else if (entry.name !== "README.md") {
        // Non-markdown files - keep full name with extension
        paths.push(relativePath);
      }
    }
  }
  
  return paths;
}

function findParentPath(pagePath: string, allPaths: string[]): string | undefined {
  const pageDir = dirname(pagePath);
  if (!pageDir || pageDir === ".") {
    return undefined;
  }
  
  // Find the page whose path exactly matches the page's directory
  for (const path of allPaths) {
    const parentDir = path.replace(/\/README$/, "");
    if (pageDir === parentDir) {
      return path;
    }
  }
  
  return undefined;
}

export function listPages(): Page[] {
  const pagesRoot = getPagesRoot();
  const allPaths = getAllPagePathsRecursive(pagesRoot);
  
  const pages: Page[] = [];
  for (const path of allPaths) {
    const page = readPageInternal(path, allPaths);
    if (page) {
      pages.push(page);
    }
  }
  
  for (const page of pages) {
    const children = pages.filter((p) => isChildPage(page.path, p.path));
    page.children = children.map((p) => p.path);
    page.parent = findParentPath(page.path, allPaths);
  }
  
  return pages;
}

function readPageInternal(pagePath: string, allPaths?: string[]): Page | null {
  try {
    const pagesRoot = getPagesRoot();
    
    // Check if this is a non-markdown file (has an extension other than .md)
    // Need to distinguish between:
    // - .hidden-page (hidden markdown page, no extension)
    // - image.png (non-markdown file with extension)
    // - page (regular markdown page, no extension)
    const lastSegment = pagePath.split('/').pop() || '';
    const lastDotIndex = lastSegment.lastIndexOf('.');
    const hasExtension = lastDotIndex > 0 && lastDotIndex < lastSegment.length - 1;
    const isMarkdown = !hasExtension || pagePath.endsWith('.md');
    
    let filePath: string;
    let actualPath: string;
    let content = "";
    let frontMatter: FrontMatter = {};
    
    if (isMarkdown) {
      const relativePath = pagePath.replace(/\.md$/, "");
      
      const singleFilePath = join(pagesRoot, `${relativePath}.md`);
      const folderPath = join(pagesRoot, relativePath);
      const readmePath = join(folderPath, "README.md");
      
      if (existsSync(readmePath)) {
        filePath = readmePath;
        actualPath = relativePath;
      } else if (existsSync(singleFilePath)) {
        filePath = singleFilePath;
        actualPath = relativePath;
      } else {
        return null;
      }
      
      const fileContent = readFileSync(filePath, "utf-8");
      const parsed = parseFrontMatter(fileContent);
      frontMatter = parsed.frontMatter;
      content = parsed.content;
    } else {
      // Non-markdown file
      actualPath = pagePath;
      filePath = join(pagesRoot, pagePath);
      
      if (!existsSync(filePath)) {
        return null;
      }
      
      // For non-markdown files, don't read content (could be binary)
      content = "";
      frontMatter = {};
    }
    
    const paths = allPaths || getAllPagePathsRecursive(pagesRoot);
    const children = isMarkdown ? paths.filter((p) => isChildPage(actualPath, p)) : [];
    const parent = findParentPath(actualPath, paths);
    
    // Determine if the file/folder is hidden (starts with .)
    const pathParts = actualPath.split('/');
    const isHidden = pathParts.some(part => part.startsWith('.'));
    
    return {
      path: actualPath,
      title: getPageTitleFromPath(actualPath),
      content: content,
      frontMatter,
      children: children,
      parent,
      isHidden,
      isMarkdown
    };
  } catch (error) {
    return null;
  }
}

export function readPage(pagePath: string): Page | null {
  return readPageInternal(pagePath);
}

export function createPage(pagePath: string, content: string = ""): Page {
  const pagesRoot = getPagesRoot();
  const relativePath = pagePath.replace(/\.md$/, "");
  const parentPath = dirname(relativePath);
  
  if (parentPath && parentPath !== ".") {
    ensurePageFolderized(parentPath);
  }
  
  const filePath = join(pagesRoot, `${relativePath}.md`);
  
  ensureDirectoryExists(filePath);
  
  writeFileSync(filePath, content, "utf-8");
  
  const page = readPage(relativePath);
  if (!page) {
    throw new NotFoundError("Failed to create page");
  }
  
  return page;
}

export function updatePage(pagePath: string, content: string): Page {
  const existing = readPage(pagePath);
  if (!existing) {
    throw new NotFoundError("Page not found");
  }
  
  const pagesRoot = getPagesRoot();
  const relativePath = pagePath.replace(/\.md$/, "");
  
  const singleFilePath = join(pagesRoot, `${relativePath}.md`);
  const folderPath = join(pagesRoot, relativePath);
  const readmePath = join(folderPath, "README.md");
  
  let filePath: string;
  if (existsSync(readmePath)) {
    filePath = readmePath;
  } else {
    filePath = singleFilePath;
  }
  
  writeFileSync(filePath, content, "utf-8");
  
  const page = readPage(relativePath);
  if (!page) {
    throw new NotFoundError("Failed to update page");
  }
  
  return page;
}

export function renamePage(oldPath: string, newPath: string): Page {
  const existing = readPage(oldPath);
  if (!existing) {
    throw new NotFoundError("Page not found");
  }
  
  const pagesRoot = getPagesRoot();
  const oldRelativePath = oldPath.replace(/\.md$/, "");
  const newRelativePath = newPath.replace(/\.md$/, "");
  
  const oldSingleFile = join(pagesRoot, `${oldRelativePath}.md`);
  const oldFolder = join(pagesRoot, oldRelativePath);
  const oldReadme = join(oldFolder, "README.md");
  
  const newSingleFile = join(pagesRoot, `${newRelativePath}.md`);
  const newFolder = join(pagesRoot, newRelativePath);
  const newReadme = join(newFolder, "README.md");
  
  ensureDirectoryExists(newSingleFile);
  
  if (existsSync(oldReadme)) {
    if (!existsSync(newFolder)) {
      mkdirSync(newFolder, { recursive: true });
    }
    renameSync(oldReadme, newReadme);
    
    const children = readdirSync(oldFolder).filter((f) => f !== "README.md" && f.endsWith(".md"));
    for (const child of children) {
      const oldChildPath = join(oldFolder, child);
      const newChildPath = join(newFolder, child);
      renameSync(oldChildPath, newChildPath);
    }
    
    const attachments = readdirSync(oldFolder).filter((f) => f !== "README.md" && !f.endsWith(".md"));
    for (const attachment of attachments) {
      const oldAttachmentPath = join(oldFolder, attachment);
      const newAttachmentPath = join(newFolder, attachment);
      renameSync(oldAttachmentPath, newAttachmentPath);
    }
    
    if (readdirSync(oldFolder).length === 0) {
      rmdirSync(oldFolder);
    }
  } else if (existsSync(oldSingleFile)) {
    renameSync(oldSingleFile, newSingleFile);
  } else {
    throw new NotFoundError("Page not found");
  }
  
  const page = readPage(newRelativePath);
  if (!page) {
    throw new NotFoundError("Failed to rename page");
  }
  
  return page;
}

export function deletePage(pagePath: string): void {
  const pagesRoot = getPagesRoot();
  const relativePath = pagePath.replace(/\.md$/, "");
  
  // Validate and resolve the path to ensure correct handling of paths with spaces
  const pathValidation = validatePath(relativePath);
  if (!pathValidation.valid) {
    throw new NotFoundError("Page not found");
  }
  
  const resolvedPath = pathValidation.resolvedPath;
  const singleFilePath = `${resolvedPath}.md`;
  const folderPath = resolvedPath;
  const readmePath = join(folderPath, "README.md");
  
  if (existsSync(readmePath)) {
    const children = readdirSync(folderPath);
    if (children.length > 1) {
      throw new ValidationError("Cannot delete page with children or attachments");
    }
    unlinkSync(readmePath);
    rmdirSync(folderPath);
  } else if (existsSync(singleFilePath)) {
    unlinkSync(singleFilePath);
  } else {
    throw new NotFoundError("Page not found");
  }
  
  // Check if parent should be defolderized after deleting this child
  // Calculate parent from the original relativePath (before resolution)
  // This ensures we get the correct parent path format
  const parentDir = dirname(relativePath);
  
  if (parentDir && parentDir !== ".") {
    // Validate and normalize the parent path before checking
    const parentValidation = validatePath(parentDir);
    if (parentValidation.valid) {
      // Use the relative path (not resolved) for checkShouldDefolderize
      // since it expects a relative path and resolves it internally
      if (checkShouldDefolderize(parentDir)) {
        defolderizePage(parentDir);
      }
    }
  }
}
