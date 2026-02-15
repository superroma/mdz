import type { Page } from "../../types";

type FilterQuery = Record<string, unknown>;

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export function normalizeValue(val: unknown): unknown {
  if (val instanceof Date) return toISODate(val);
  if (typeof val === "string" && ISO_DATETIME_RE.test(val)) return val.slice(0, 10);
  return val;
}

export function resolveValue(val: unknown): unknown {
  if (val instanceof Date) return toISODate(val);
  if (typeof val !== "string") return val;
  const now = new Date();
  switch (val) {
    case "today":
      return toISODate(now);
    case "yesterday":
      return toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    case "tomorrow":
      return toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    default:
      return val;
  }
}

function matchesFilter(page: Page, filter: FilterQuery): boolean {
  for (const [key, condition] of Object.entries(filter)) {
    const value = normalizeValue(page.frontMatter[key]);
    
    if (typeof condition === "object" && condition !== null && !Array.isArray(condition)) {
      const ops = condition as Record<string, unknown>;
      
      if ("$ne" in ops && value === resolveValue(ops.$ne)) return false;
      if ("$eq" in ops && value !== resolveValue(ops.$eq)) return false;
      if ("$in" in ops && Array.isArray(ops.$in) && !ops.$in.map(resolveValue).includes(value)) return false;
      if ("$lt" in ops && (value === undefined || value >= resolveValue(ops.$lt))) return false;
      if ("$gt" in ops && (value === undefined || value <= resolveValue(ops.$gt))) return false;
      if ("$lte" in ops && (value === undefined || value > resolveValue(ops.$lte))) return false;
      if ("$gte" in ops && (value === undefined || value < resolveValue(ops.$gte))) return false;
    } else {
      if (value !== resolveValue(condition)) return false;
    }
  }
  
  return true;
}

export function filterPages(pages: Page[], filter?: FilterQuery): Page[] {
  if (!filter) return pages;
  return pages.filter((page) => matchesFilter(page, filter));
}

export function sortPages(pages: Page[], sort?: string): Page[] {
  if (!sort) return pages;

  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;

  return [...pages].sort((a, b) => {
    const aVal = field === "name" ? a.title : normalizeValue(a.frontMatter[field]);
    const bVal = field === "name" ? b.title : normalizeValue(b.frontMatter[field]);

    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;

    let comparison = 0;
    if (typeof aVal === "string" && typeof bVal === "string") {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return desc ? -comparison : comparison;
  });
}

