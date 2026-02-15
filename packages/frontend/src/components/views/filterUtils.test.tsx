import { describe, it, expect, vi, afterEach } from "vitest";
import { filterPages, resolveValue, normalizeValue } from "./filterUtils";
import type { Page } from "../../types";

const makePage = (frontMatter: Record<string, unknown>): Page => ({
  path: "test",
  title: "Test",
  content: "",
  frontMatter,
  children: [],
});

describe("resolveValue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves 'today' to current date", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 14) });
    expect(resolveValue("today")).toBe("2026-02-14");
  });

  it("resolves 'yesterday' to previous date", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 14) });
    expect(resolveValue("yesterday")).toBe("2026-02-13");
  });

  it("resolves 'tomorrow' to next date", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 14) });
    expect(resolveValue("tomorrow")).toBe("2026-02-15");
  });

  it("handles month boundary for yesterday", () => {
    vi.useFakeTimers({ now: new Date(2026, 2, 1) });
    expect(resolveValue("yesterday")).toBe("2026-02-28");
  });

  it("handles month boundary for tomorrow", () => {
    vi.useFakeTimers({ now: new Date(2026, 0, 31) });
    expect(resolveValue("tomorrow")).toBe("2026-02-01");
  });

  it("passes through non-expression strings", () => {
    expect(resolveValue("2026-03-01")).toBe("2026-03-01");
    expect(resolveValue("Done")).toBe("Done");
  });

  it("passes through non-string values", () => {
    expect(resolveValue(42)).toBe(42);
    expect(resolveValue(true)).toBe(true);
    expect(resolveValue(null)).toBe(null);
  });

  it("converts Date objects to YYYY-MM-DD strings", () => {
    expect(resolveValue(new Date(2026, 1, 15))).toBe("2026-02-15");
  });
});

describe("normalizeValue", () => {
  it("converts Date objects to YYYY-MM-DD strings", () => {
    expect(normalizeValue(new Date(2026, 1, 15))).toBe("2026-02-15");
    expect(normalizeValue(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("strips time from ISO datetime strings (JSON-serialized dates)", () => {
    expect(normalizeValue("2026-02-15T00:00:00.000Z")).toBe("2026-02-15");
    expect(normalizeValue("2026-01-01T12:30:00.000Z")).toBe("2026-01-01");
  });

  it("passes through plain date strings unchanged", () => {
    expect(normalizeValue("2026-02-15")).toBe("2026-02-15");
  });

  it("passes through non-date strings unchanged", () => {
    expect(normalizeValue("Done")).toBe("Done");
  });

  it("passes through other types unchanged", () => {
    expect(normalizeValue(42)).toBe(42);
    expect(normalizeValue(undefined)).toBe(undefined);
  });
});

describe("filterPages with date expressions", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("filters with $lte today", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 14) });
    const pages = [
      makePage({ due_date: "2026-02-13" }),
      makePage({ due_date: "2026-02-14" }),
      makePage({ due_date: "2026-02-15" }),
    ];
    const result = filterPages(pages, { due_date: { $lte: "today" } });
    expect(result).toHaveLength(2);
    expect(result[0].frontMatter.due_date).toBe("2026-02-13");
    expect(result[1].frontMatter.due_date).toBe("2026-02-14");
  });

  it("filters with $gte tomorrow", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 14) });
    const pages = [
      makePage({ due_date: "2026-02-14" }),
      makePage({ due_date: "2026-02-15" }),
      makePage({ due_date: "2026-02-16" }),
    ];
    const result = filterPages(pages, { due_date: { $gte: "tomorrow" } });
    expect(result).toHaveLength(2);
    expect(result[0].frontMatter.due_date).toBe("2026-02-15");
    expect(result[1].frontMatter.due_date).toBe("2026-02-16");
  });

  it("filters with $eq today", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 14) });
    const pages = [
      makePage({ due_date: "2026-02-13" }),
      makePage({ due_date: "2026-02-14" }),
      makePage({ due_date: "2026-02-15" }),
    ];
    const result = filterPages(pages, { due_date: { $eq: "today" } });
    expect(result).toHaveLength(1);
    expect(result[0].frontMatter.due_date).toBe("2026-02-14");
  });

  it("combines date expression with other filters", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 14) });
    const pages = [
      makePage({ due_date: "2026-02-13", status: "Todo" }),
      makePage({ due_date: "2026-02-14", status: "Done" }),
      makePage({ due_date: "2026-02-14", status: "Todo" }),
    ];
    const result = filterPages(pages, {
      due_date: { $lte: "today" },
      status: { $ne: "Done" },
    });
    expect(result).toHaveLength(2);
  });
});

describe("filterPages with Date objects from YAML", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles Date objects in front-matter with $eq today", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 15) });
    const pages = [
      makePage({ due_date: new Date(2026, 1, 14) }),
      makePage({ due_date: new Date(2026, 1, 15) }),
      makePage({ due_date: new Date(2026, 1, 16) }),
    ];
    const result = filterPages(pages, { due_date: { $eq: "today" } });
    expect(result).toHaveLength(1);
  });

  it("handles Date objects in front-matter with $lte today", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 15) });
    const pages = [
      makePage({ due_date: new Date(2026, 1, 14) }),
      makePage({ due_date: new Date(2026, 1, 15) }),
      makePage({ due_date: new Date(2026, 1, 16) }),
    ];
    const result = filterPages(pages, { due_date: { $lte: "today" } });
    expect(result).toHaveLength(2);
  });

  it("handles Date objects in front-matter with $gt yesterday", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 15) });
    const pages = [
      makePage({ due_date: new Date(2026, 1, 13) }),
      makePage({ due_date: new Date(2026, 1, 14) }),
      makePage({ due_date: new Date(2026, 1, 15) }),
    ];
    const result = filterPages(pages, { due_date: { $gt: "yesterday" } });
    expect(result).toHaveLength(1);
  });

  it("handles Date objects with plain date string comparison", () => {
    const pages = [
      makePage({ due_date: new Date(2026, 1, 15) }),
      makePage({ due_date: new Date(2026, 2, 1) }),
    ];
    const result = filterPages(pages, { due_date: { $eq: "2026-02-15" } });
    expect(result).toHaveLength(1);
  });

  it("handles mix of Date objects and strings", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 15) });
    const pages = [
      makePage({ due_date: new Date(2026, 1, 15) }),
      makePage({ due_date: "2026-02-15" }),
    ];
    const result = filterPages(pages, { due_date: { $eq: "today" } });
    expect(result).toHaveLength(2);
  });
});

describe("filterPages with JSON-serialized dates (real API scenario)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("matches ISO datetime string with $eq today", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 15) });
    const pages = [
      makePage({ due_date: "2026-02-15T00:00:00.000Z" }),
      makePage({ due_date: "2026-02-16T00:00:00.000Z" }),
    ];
    const result = filterPages(pages, { due_date: { $eq: "today" } });
    expect(result).toHaveLength(1);
  });

  it("matches ISO datetime string with $lte today", () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 15) });
    const pages = [
      makePage({ due_date: "2026-02-14T00:00:00.000Z" }),
      makePage({ due_date: "2026-02-15T00:00:00.000Z" }),
      makePage({ due_date: "2026-02-16T00:00:00.000Z" }),
    ];
    const result = filterPages(pages, { due_date: { $lte: "today" } });
    expect(result).toHaveLength(2);
  });

  it("matches ISO datetime string with plain date comparison", () => {
    const pages = [
      makePage({ due_date: "2026-02-15T00:00:00.000Z" }),
      makePage({ due_date: "2026-03-01T00:00:00.000Z" }),
    ];
    const result = filterPages(pages, { due_date: { $eq: "2026-02-15" } });
    expect(result).toHaveLength(1);
  });
});
