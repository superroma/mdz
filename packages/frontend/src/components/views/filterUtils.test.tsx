import { describe, it, expect, vi, afterEach } from "vitest";
import { filterPages, resolveValue } from "./filterUtils";
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
