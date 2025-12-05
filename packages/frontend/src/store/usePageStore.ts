import { create } from "zustand";
import type { Page } from "../types";
import * as api from "../api/client";

function computeVisiblePages(pages: Page[], showHidden: boolean): Page[] {
  return showHidden
    ? pages
    : pages.filter(page => !page.isHidden && page.isMarkdown !== false);
}

interface PageStore {
  pages: Page[];
  visiblePages: Page[];
  currentPage: Page | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  showHidden: boolean;
  error: string | null;

  loadPages: () => Promise<void>;
  loadPage: (path: string) => Promise<void>;
  createPage: (parent?: string) => Promise<Page>;
  updatePage: (path: string, content: string, frontMatter?: Record<string, unknown>) => Promise<void>;
  renamePage: (oldPath: string, newPath: string) => Promise<void>;
  deletePage: (path: string) => Promise<void>;
  reorderPages: (parent: string | null, order: string[]) => Promise<void>;
  toggleSidebar: () => void;
  toggleShowHidden: () => void;
  setError: (error: string | null) => void;
}

export const usePageStore = create<PageStore>((set, get) => ({
  pages: [],
  visiblePages: [],
  currentPage: null,
  isLoading: false,
  isSidebarOpen: false,
  showHidden: false,
  error: null,

  loadPages: async () => {
    try {
      set({ isLoading: true, error: null });
      const pages = await api.listPages();
      const { showHidden } = get();
      set({ 
        pages, 
        visiblePages: computeVisiblePages(pages, showHidden),
        isLoading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadPage: async (path: string) => {
    try {
      set({ isLoading: true, error: null });
      const page = await api.getPage(path);
      set({ currentPage: page, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false, currentPage: null });
    }
  },

  createPage: async (parent?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // If parent has __schema, initialize frontmatter with schema fields
      let initialFrontMatter: Record<string, unknown> = {};
      if (parent) {
        const pages = get().pages;
        const normalizedParentPath = parent.replace(/\/README$/, "");
        const parentPage = pages.find((p) => {
          const normalizedPath = p.path.replace(/\/README$/, "");
          return p.path === parent || normalizedPath === normalizedParentPath;
        });
        
        if (parentPage) {
          const schema = parentPage.frontMatter.__schema;
          if (schema && Array.isArray(schema)) {
            // Initialize frontmatter with schema fields and empty values
            initialFrontMatter = {};
            schema.forEach((field: { name: string; type: string }) => {
              if (field.name && field.name !== "__schema") {
                // Set empty values based on field type
                if (field.type === "number") {
                  initialFrontMatter[field.name] = 0;
                } else if (field.type === "checkbox") {
                  initialFrontMatter[field.name] = false;
                } else {
                  initialFrontMatter[field.name] = "";
                }
              }
            });
          }
        }
      }
      
      // Serialize frontMatter into content
      const { serializeFrontMatter } = await import("../utils/front-matter");
      const content = serializeFrontMatter(initialFrontMatter, "");
      
      const page = await api.createPage({ 
        path: "Untitled", 
        parent,
        content 
      });
      await get().loadPages();
      set({ isLoading: false });
      return page;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updatePage: async (path: string, content: string, frontMatter?: Record<string, unknown>) => {
    try {
      set({ isLoading: true, error: null });
      
      // Serialize frontMatter into content if provided
      let fullContent = content;
      if (frontMatter !== undefined) {
        const { serializeFrontMatter } = await import("../utils/front-matter");
        fullContent = serializeFrontMatter(frontMatter, content);
      }
      
      const page = await api.updatePage(path, { content: fullContent });
      set({ currentPage: page, isLoading: false });
      await get().loadPages();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  renamePage: async (oldPath: string, newPath: string) => {
    try {
      set({ isLoading: true, error: null });
      const page = await api.renamePage(oldPath, { newPath });
      set({ currentPage: page, isLoading: false });
      await get().loadPages();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deletePage: async (path: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.deletePage(path);
      set({ currentPage: null, isLoading: false });
      await get().loadPages();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  reorderPages: async (parent: string | null, order: string[]) => {
    try {
      await api.savePageOrder(parent, order);
      await get().loadPages();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  toggleShowHidden: () => {
    set((state) => {
      const newShowHidden = !state.showHidden;
      return { 
        showHidden: newShowHidden,
        visiblePages: computeVisiblePages(state.pages, newShowHidden)
      };
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__ZUSTAND_STORE__ = usePageStore;
}

