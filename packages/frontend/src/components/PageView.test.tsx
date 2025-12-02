import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PageView } from "./PageView";
import { ARIA_LABELS } from "../constants/aria-labels";

const mockStoreState = {
  pages: [] as any[],
  currentPage: null as any,
  isLoading: false,
  isSidebarOpen: false,
  showHidden: false,
  error: null as string | null,
  loadPages: vi.fn().mockResolvedValue(undefined),
  loadPage: vi.fn().mockResolvedValue(undefined),
  createPage: vi.fn(),
  updatePage: vi.fn(),
  renamePage: vi.fn(),
  deletePage: vi.fn(),
  toggleSidebar: vi.fn(),
  toggleShowHidden: vi.fn(),
  setError: vi.fn(),
};

vi.mock("../store/usePageStore", () => ({
  usePageStore: () => mockStoreState,
}));
vi.mock("./UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));
vi.mock("./AttachmentsPanel", () => ({
  AttachmentsPanel: () => <div data-testid="attachments-panel">Attachments</div>,
}));
vi.mock("./ContentEditor", () => ({
  ContentEditor: ({ content }: { content: string }) => (
    <div data-testid="content-editor">Content: {content.substring(0, 50)}</div>
  ),
}));
vi.mock("./CustomFieldsPanel", () => ({
  CustomFieldsPanel: () => <div data-testid="custom-fields-panel">Fields</div>,
}));

function renderWithRouter(pagePath: string) {
  return render(
    <MemoryRouter initialEntries={[`/${pagePath}`]}>
      <Routes>
        <Route path="/*" element={<PageView />} />
      </Routes>
    </MemoryRouter>
  );
}

function resetMockStore() {
  mockStoreState.pages = [];
  mockStoreState.currentPage = null;
  mockStoreState.isLoading = false;
  mockStoreState.error = null;
  mockStoreState.loadPages.mockClear();
  mockStoreState.loadPage.mockClear();
}

describe("PageView", () => {
  beforeEach(() => {
    resetMockStore();
  });

  describe("loading state", () => {
    it("shows loading when currentPage is null", () => {
      mockStoreState.currentPage = null;

      renderWithRouter("TestPage");

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows loading when currentPage path does not match URL path (stale data)", () => {
      mockStoreState.currentPage = {
        path: "OldPage",
        title: "Old Page Title",
        content: "old content",
        frontMatter: {},
        children: [],
      };

      renderWithRouter("NewPage");

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows content when currentPage path matches URL path", () => {
      mockStoreState.currentPage = {
        path: "TestPage",
        title: "Test Page Title",
        content: "test content",
        frontMatter: {},
        children: [],
      };

      renderWithRouter("TestPage");

      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByTestId("content-editor")).toBeInTheDocument();
    });
  });

  describe("title field", () => {
    it("shows path-derived title when loading (currentPage null)", () => {
      mockStoreState.currentPage = null;

      renderWithRouter("My Test Page");

      const titleInput = screen.getByRole("textbox", { name: ARIA_LABELS.pageTitle });
      expect(titleInput).toHaveValue("My Test Page");
    });

    it("shows path-derived title when stale data present", () => {
      mockStoreState.currentPage = {
        path: "OldPage",
        title: "Old Title Should Not Show",
        content: "",
        frontMatter: {},
        children: [],
      };

      renderWithRouter("NewPage");

      const titleInput = screen.getByRole("textbox", { name: ARIA_LABELS.pageTitle });
      expect(titleInput).toHaveValue("NewPage");
    });

    it("shows actual page title when page is loaded", () => {
      mockStoreState.currentPage = {
        path: "TestPage",
        title: "Actual Page Title",
        content: "",
        frontMatter: {},
        children: [],
      };

      renderWithRouter("TestPage");

      const titleInput = screen.getByRole("textbox", { name: ARIA_LABELS.pageTitle });
      expect(titleInput).toHaveValue("Actual Page Title");
    });

    it("extracts last path segment for nested paths", () => {
      mockStoreState.currentPage = null;

      renderWithRouter("Parent/Child/GrandChild");

      const titleInput = screen.getByRole("textbox", { name: ARIA_LABELS.pageTitle });
      expect(titleInput).toHaveValue("GrandChild");
    });
  });

  describe("delete button", () => {
    it("is disabled when loading", () => {
      mockStoreState.currentPage = null;

      renderWithRouter("TestPage");

      const deleteButton = screen.getByRole("button", { name: ARIA_LABELS.deletePage });
      expect(deleteButton).toBeDisabled();
    });

    it("is disabled when stale data present", () => {
      mockStoreState.currentPage = {
        path: "OldPage",
        title: "Old",
        content: "",
        frontMatter: {},
        children: [],
      };

      renderWithRouter("NewPage");

      const deleteButton = screen.getByRole("button", { name: ARIA_LABELS.deletePage });
      expect(deleteButton).toBeDisabled();
    });

    it("is enabled when page is loaded", () => {
      mockStoreState.currentPage = {
        path: "TestPage",
        title: "Test",
        content: "",
        frontMatter: {},
        children: [],
      };

      renderWithRouter("TestPage");

      const deleteButton = screen.getByRole("button", { name: ARIA_LABELS.deletePage });
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe("header elements always visible", () => {
    it("shows back button while loading", () => {
      mockStoreState.currentPage = null;

      renderWithRouter("TestPage");

      expect(screen.getByRole("button", { name: ARIA_LABELS.goBack })).toBeInTheDocument();
    });

    it("shows user menu while loading", () => {
      mockStoreState.currentPage = null;

      renderWithRouter("TestPage");

      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });

    it("shows breadcrumbs while loading", () => {
      mockStoreState.currentPage = null;

      renderWithRouter("TestPage");

      expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when error is set", () => {
      mockStoreState.error = "Page not found";

      renderWithRouter("TestPage");

      expect(screen.getByText("Page not found")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Go Home" })).toBeInTheDocument();
    });
  });
});
