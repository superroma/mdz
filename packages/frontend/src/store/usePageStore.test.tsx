import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePageStore } from "./usePageStore";
import * as api from "../api/client";
import type { Page } from "../types";

vi.mock("../api/client");

describe("usePageStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePageStore.setState({
      pages: [],
      visiblePages: [],
      currentPage: null,
      isLoading: false,
      isSidebarOpen: false,
      showHidden: false,
      error: null,
    });
  });

  describe("createPage", () => {
    it("creates page without frontmatter when no parent", async () => {
      const mockPage: Page = {
        path: "Untitled",
        title: "Untitled",
        content: "",
        frontMatter: {},
        children: [],
      };

      vi.mocked(api.createPage).mockResolvedValue(mockPage);
      vi.mocked(api.listPages).mockResolvedValue([mockPage]);

      const store = usePageStore.getState();
      const page = await store.createPage();

      expect(api.createPage).toHaveBeenCalledWith({
        path: "Untitled",
        parent: undefined,
        content: "",
      });
      expect(page).toEqual(mockPage);
    });

    it("initializes frontmatter with schema fields when parent has __schema", async () => {
      const parentPage: Page = {
        path: "Parent",
        title: "Parent",
        content: "",
        frontMatter: {
          __schema: [
            { name: "status", type: "text" },
            { name: "priority", type: "number" },
            { name: "completed", type: "checkbox" },
            { name: "category", type: "select", options: ["A", "B"] },
          ],
        },
        children: [],
      };

      const childPage: Page = {
        path: "Parent/Untitled",
        title: "Untitled",
        content: "",
        frontMatter: {
          status: "",
          priority: 0,
          completed: false,
          category: "",
        },
        children: [],
        parent: "Parent",
      };

      vi.mocked(api.createPage).mockResolvedValue(childPage);
      vi.mocked(api.listPages).mockResolvedValue([parentPage, childPage]);

      usePageStore.setState({ pages: [parentPage] });

      const store = usePageStore.getState();
      const page = await store.createPage("Parent");

      expect(api.createPage).toHaveBeenCalledWith({
        path: "Untitled",
        parent: "Parent",
        content: "---\nstatus: ''\npriority: 0\ncompleted: false\ncategory: ''\n---\n",
      });
      expect(page).toEqual(childPage);
    });

    it("does not initialize frontmatter when parent has no __schema", async () => {
      const parentPage: Page = {
        path: "Parent",
        title: "Parent",
        content: "",
        frontMatter: {
          title: "Parent Title",
        },
        children: [],
      };

      const childPage: Page = {
        path: "Parent/Untitled",
        title: "Untitled",
        content: "",
        frontMatter: {},
        children: [],
        parent: "Parent",
      };

      vi.mocked(api.createPage).mockResolvedValue(childPage);
      vi.mocked(api.listPages).mockResolvedValue([parentPage, childPage]);

      usePageStore.setState({ pages: [parentPage] });

      const store = usePageStore.getState();
      const page = await store.createPage("Parent");

      expect(api.createPage).toHaveBeenCalledWith({
        path: "Untitled",
        parent: "Parent",
        content: "",
      });
      expect(page).toEqual(childPage);
    });

    it("handles parent path normalization with README", async () => {
      const parentPage: Page = {
        path: "Parent/README",
        title: "Parent",
        content: "",
        frontMatter: {
          __schema: [{ name: "status", type: "text" }],
        },
        children: [],
      };

      const childPage: Page = {
        path: "Parent/Untitled",
        title: "Untitled",
        content: "",
        frontMatter: {
          status: "",
        },
        children: [],
        parent: "Parent/README",
      };

      vi.mocked(api.createPage).mockResolvedValue(childPage);
      vi.mocked(api.listPages).mockResolvedValue([parentPage, childPage]);

      usePageStore.setState({ pages: [parentPage] });

      const store = usePageStore.getState();
      const page = await store.createPage("Parent/README");

      expect(api.createPage).toHaveBeenCalledWith({
        path: "Untitled",
        parent: "Parent/README",
        content: "---\nstatus: ''\n---\n",
      });
      expect(page).toEqual(childPage);
    });
  });
});

