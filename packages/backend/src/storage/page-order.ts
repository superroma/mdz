import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getPagesRoot } from "./path-validator.js";
import { parseFrontMatter, serializeFrontMatter } from "./front-matter.js";
import type { Page } from "./page-storage.js";

function getParentFilePath(parentPath: string | null): string | null {
  const pagesRoot = getPagesRoot();
  
  if (!parentPath) {
    return join(pagesRoot, "README.md");
  }
  
  const folderReadme = join(pagesRoot, parentPath, "README.md");
  if (existsSync(folderReadme)) {
    return folderReadme;
  }
  
  const singleFile = join(pagesRoot, `${parentPath}.md`);
  if (existsSync(singleFile)) {
    return singleFile;
  }
  
  return null;
}

export function loadPageOrder(parentPath: string | null): string[] {
  const filePath = getParentFilePath(parentPath);
  
  if (!filePath || !existsSync(filePath)) {
    return [];
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = parseFrontMatter(content);
    const children = parsed.frontMatter.__children;
    
    if (Array.isArray(children)) {
      return children.filter(c => typeof c === "string");
    }
    return [];
  } catch {
    return [];
  }
}

export function savePageOrder(parentPath: string | null, order: string[]): void {
  const pagesRoot = getPagesRoot();
  let filePath = getParentFilePath(parentPath);
  
  if (!filePath) {
    if (!parentPath) {
      filePath = join(pagesRoot, "README.md");
      writeFileSync(filePath, "", "utf-8");
    } else {
      return;
    }
  }

  const content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  const parsed = parseFrontMatter(content);
  
  if (order.length > 0) {
    parsed.frontMatter.__children = order;
  } else {
    delete parsed.frontMatter.__children;
  }
  
  const newContent = serializeFrontMatter(parsed.frontMatter, parsed.content);
  writeFileSync(filePath, newContent, "utf-8");
}

function isHiddenPage(page: Page): boolean {
  return page.isHidden === true;
}

function getPageName(page: Page): string {
  const parts = page.path.split("/");
  return parts[parts.length - 1];
}

function getPageParent(page: Page): string | null {
  const parts = page.path.split("/");
  if (parts.length <= 1) {
    return null;
  }
  return parts.slice(0, -1).join("/");
}

export function applyOrdering(pages: Page[]): Page[] {
  const pagesByParent = new Map<string, Page[]>();

  for (const page of pages) {
    const parent = getPageParent(page) ?? "__root__";
    if (!pagesByParent.has(parent)) {
      pagesByParent.set(parent, []);
    }
    pagesByParent.get(parent)!.push(page);
  }

  const result: Page[] = [];

  for (const [parent, siblings] of pagesByParent) {
    const parentPath = parent === "__root__" ? null : parent;
    const order = loadPageOrder(parentPath);

    const hidden: Page[] = [];
    const visible: Page[] = [];

    for (const page of siblings) {
      if (isHiddenPage(page)) {
        hidden.push(page);
      } else {
        visible.push(page);
      }
    }

    const ordered: Page[] = [];
    const unordered: Page[] = [];

    const orderSet = new Set(order);
    for (const page of visible) {
      const name = getPageName(page);
      if (orderSet.has(name)) {
        ordered.push(page);
      } else {
        unordered.push(page);
      }
    }

    ordered.sort((a, b) => {
      const aName = getPageName(a);
      const bName = getPageName(b);
      return order.indexOf(aName) - order.indexOf(bName);
    });

    unordered.sort((a, b) => a.title.localeCompare(b.title));

    hidden.sort((a, b) => a.title.localeCompare(b.title));

    result.push(...ordered, ...unordered, ...hidden);
  }

  return result;
}

export function cleanAndSaveOrder(parentPath: string | null, order: string[], existingPages: Page[]): void {
  const parentKey = parentPath ?? "__root__";
  
  const existingNames = new Set(
    existingPages
      .filter(p => {
        const pageParent = getPageParent(p);
        const pageParentKey = pageParent ?? "__root__";
        return pageParentKey === parentKey && !isHiddenPage(p);
      })
      .map(p => getPageName(p))
  );

  const cleanedOrder = order.filter(name => existingNames.has(name));
  
  savePageOrder(parentPath, cleanedOrder);
}
