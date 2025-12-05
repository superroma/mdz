import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import yaml from "js-yaml";
import { getPagesRoot } from "./path-validator.js";
import type { Page } from "./page-storage.js";

const ORDER_FILENAME = ".pages.yaml";

interface PageOrderConfig {
  order: string[];
}

export function getOrderFilePath(parentPath: string | null): string {
  const pagesRoot = getPagesRoot();
  if (!parentPath) {
    return join(pagesRoot, ORDER_FILENAME);
  }
  return join(pagesRoot, parentPath, ORDER_FILENAME);
}

export function loadPageOrder(parentPath: string | null): string[] {
  const orderFile = getOrderFilePath(parentPath);

  if (!existsSync(orderFile)) {
    return [];
  }

  try {
    const content = readFileSync(orderFile, "utf-8");
    const config = yaml.load(content) as PageOrderConfig | null;
    return config?.order ?? [];
  } catch {
    return [];
  }
}

export function savePageOrder(parentPath: string | null, order: string[]): void {
  const orderFile = getOrderFilePath(parentPath);
  const config: PageOrderConfig = { order };
  const content = yaml.dump(config);
  writeFileSync(orderFile, content, "utf-8");
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
