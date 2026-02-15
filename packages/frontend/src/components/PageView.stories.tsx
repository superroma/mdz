import type { Meta, StoryObj } from "@storybook/react";
import { PageView } from "./PageView";
import { usePageStore } from "../store/usePageStore";
import type { Page } from "../types";

const noop = async () => {};

const MOCK_PARENT: Page = {
  path: "Components/README",
  title: "Components",
  content: "",
  frontMatter: {
    __schema: [
      { name: "status", type: "select", options: ["Todo", "In Progress", "Done"] },
      { name: "priority", type: "select", options: ["Low", "Medium", "High"] },
      { name: "category", type: "select", options: ["Frontend", "Backend"] },
      { name: "due_date", type: "date" },
    ],
  },
  children: ["Components/task-1", "Components/task-2"],
};

const MOCK_PAGE: Page = {
  path: "Components/task-1",
  title: "Design system audit",
  content: "Review all existing components for consistency.",
  frontMatter: {
    status: "In Progress",
    priority: "High",
    category: "Frontend",
    due_date: "2026-03-01",
  },
  children: [],
  parent: "Components/README",
  canEdit: true,
};

const MOCK_PAGE_READONLY: Page = {
  ...MOCK_PAGE,
  canEdit: false,
};

const MOCK_PAGES = [MOCK_PARENT, MOCK_PAGE];

function setupStore(overrides: Partial<ReturnType<typeof usePageStore.getState>> = {}) {
  usePageStore.setState({
    pages: MOCK_PAGES,
    visiblePages: MOCK_PAGES,
    currentPage: MOCK_PAGE,
    isLoading: false,
    error: null,
    loadPages: noop,
    loadPage: noop,
    updatePage: noop,
    renamePage: noop,
    deletePage: noop,
    reorderPages: noop,
    ...overrides,
  });
}

const meta: Meta<typeof PageView> = {
  component: PageView,
  parameters: {
    reactRouter: {
      initialEntries: ["/Components/task-1"],
      routePath: "/*",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "600px", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    setupStore();
  },
};
export default meta;

type Story = StoryObj<typeof PageView>;

export const Default: Story = {};

export const ReadOnly: Story = {
  beforeEach: () => {
    setupStore({ currentPage: MOCK_PAGE_READONLY });
  },
};

export const ErrorState: Story = {
  parameters: {
    reactRouter: {
      initialEntries: ["/NonExistent/Page"],
      routePath: "/*",
    },
  },
  beforeEach: () => {
    setupStore({ currentPage: null, error: "Page not found" });
  },
};

export const WithSidebarToggle: Story = {
  args: {
    onToggleSidebar: () => {},
    isSidebarOpen: false,
  },
};
