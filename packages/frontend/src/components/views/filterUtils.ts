import type { Page } from "../../types";

type FilterQuery = Record<string, unknown>;

function matchesFilter(page: Page, filter: FilterQuery): boolean {
  for (const [key, condition] of Object.entries(filter)) {
    const value = page.frontMatter[key];
    
    if (typeof condition === "object" && condition !== null && !Array.isArray(condition)) {
      const ops = condition as Record<string, unknown>;
      
      if ("$ne" in ops && value === ops.$ne) return false;
      if ("$eq" in ops && value !== ops.$eq) return false;
      if ("$in" in ops && Array.isArray(ops.$in) && !ops.$in.includes(value)) return false;
      if ("$lt" in ops && (value === undefined || value >= ops.$lt)) return false;
      if ("$gt" in ops && (value === undefined || value <= ops.$gt)) return false;
      if ("$lte" in ops && (value === undefined || value > ops.$lte)) return false;
      if ("$gte" in ops && (value === undefined || value < ops.$gte)) return false;
    } else {
      if (value !== condition) return false;
    }
  }
  
  return true;
}

export function filterPages(pages: Page[], filter?: FilterQuery): Page[] {
  if (!filter) return pages;
  return pages.filter((page) => matchesFilter(page, filter));
}

export function sortPages(pages: Page[], sortField?: string, sortOrder: "asc" | "desc" = "asc"): Page[] {
  if (!sortField) return pages;
  
  return [...pages].sort((a, b) => {
    const aVal = a.frontMatter[sortField];
    const bVal = b.frontMatter[sortField];
    
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
    
    return sortOrder === "asc" ? comparison : -comparison;
  });
}

