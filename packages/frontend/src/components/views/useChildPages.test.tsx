import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useChildPages } from "./useChildPages";
import type { Page } from "../../types";

vi.mock("../../api/client", () => ({
  listPages: vi.fn(),
}));

import * as api from "../../api/client";

const makePage = (overrides: Partial<Page>): Page => ({
  path: "test",
  title: "Test",
  content: "",
  frontMatter: {},
  children: [],
  ...overrides,
});

describe("useChildPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns visible child pages", async () => {
    vi.mocked(api.listPages).mockResolvedValue([
      makePage({ path: "Parent/README", parent: undefined, frontMatter: {} }),
      makePage({ path: "Parent/Visible", parent: "Parent", title: "Visible" }),
    ]);

    const { result } = renderHook(() => useChildPages("Parent"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.childPages).toHaveLength(1);
    expect(result.current.childPages[0].title).toBe("Visible");
  });

  it("excludes hidden pages", async () => {
    vi.mocked(api.listPages).mockResolvedValue([
      makePage({ path: "Parent/README", parent: undefined }),
      makePage({ path: "Parent/Visible", parent: "Parent", title: "Visible" }),
      makePage({ path: "Parent/.secret", parent: "Parent", title: ".secret", isHidden: true }),
    ]);

    const { result } = renderHook(() => useChildPages("Parent"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.childPages).toHaveLength(1);
    expect(result.current.childPages[0].title).toBe("Visible");
  });

  it("excludes non-markdown pages", async () => {
    vi.mocked(api.listPages).mockResolvedValue([
      makePage({ path: "Parent/README", parent: undefined }),
      makePage({ path: "Parent/Visible", parent: "Parent", title: "Visible" }),
      makePage({ path: "Parent/image.png", parent: "Parent", title: "image.png", isMarkdown: false }),
    ]);

    const { result } = renderHook(() => useChildPages("Parent"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.childPages).toHaveLength(1);
    expect(result.current.childPages[0].title).toBe("Visible");
  });

  it("returns schema fields from current page", async () => {
    const schema = [
      { name: "status", type: "select", options: ["Todo", "Done"] },
      { name: "priority", type: "select", options: ["Low", "High"] },
    ];
    vi.mocked(api.listPages).mockResolvedValue([
      makePage({ path: "Parent/README", parent: undefined, frontMatter: { __schema: schema } }),
      makePage({ path: "Parent/Child", parent: "Parent", title: "Child" }),
    ]);

    const { result } = renderHook(() => useChildPages("Parent"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schemaFields).toHaveLength(2);
    expect(result.current.schemaFields[0].name).toBe("status");
    expect(result.current.schemaFields[1].name).toBe("priority");
  });
});
