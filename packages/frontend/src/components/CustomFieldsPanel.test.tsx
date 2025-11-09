import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CustomFieldsPanel } from "./CustomFieldsPanel";
import type { Page } from "../types";
import userEvent from "@testing-library/user-event";

describe("CustomFieldsPanel", () => {
  const mockOnFieldChange = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const createPage = (overrides?: Partial<Page>): Page => ({
    path: "Test",
    title: "Test Page",
    content: "Content",
    frontMatter: {},
    children: [],
    ...overrides,
  });

  it("does not render when page has no frontmatter", () => {
    const page = createPage({ frontMatter: {} });
    const pages: Page[] = [];

    const { container } = render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders when page has frontmatter even without schema", () => {
    const page = createPage({
      frontMatter: {
        title: "Test Title",
        status: "active",
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    expect(screen.getByText("Fields")).toBeInTheDocument();
  });

  it("renders when page has frontmatter with only __schema", async () => {
    const user = userEvent.setup();
    const page = createPage({
      frontMatter: {
        __schema: [],
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Should render and show __schema as complex field
    expect(screen.getByText("Fields")).toBeInTheDocument();
    
    // Expand the panel
    const toggleButton = screen.getByRole("button");
    const isExpanded = toggleButton.textContent?.includes("−");
    if (!isExpanded) {
      await user.click(toggleButton);
    }

    // Should show __schema field
    expect(screen.getByText("__schema")).toBeInTheDocument();
  });

  it("renders when page has frontmatter with __schema and other fields", () => {
    const page = createPage({
      frontMatter: {
        __schema: [],
        title: "Test Title",
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    expect(screen.getByText("Fields")).toBeInTheDocument();
  });

  it("has title 'Fields'", () => {
    const page = createPage({
      frontMatter: {
        title: "Test Title",
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    expect(screen.getByText("Fields")).toBeInTheDocument();
    expect(screen.queryByText("Custom Fields")).not.toBeInTheDocument();
  });

  it("is collapsible", async () => {
    const user = userEvent.setup();
    const page = createPage({
      frontMatter: {
        title: "Test Title",
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    const toggleButton = screen.getByRole("button");
    expect(toggleButton).toBeInTheDocument();

    // Should show collapsed state initially (or expanded, depending on localStorage)
    const isExpanded = toggleButton.textContent?.includes("−");
    expect(isExpanded !== undefined).toBe(true);

    await user.click(toggleButton);

    // Should toggle state
    const isExpandedAfter = toggleButton.textContent?.includes("−");
    expect(isExpandedAfter).not.toBe(isExpanded);
  });

  it("persists collapsed state in localStorage across app", async () => {
    const user = userEvent.setup();
    const page1 = createPage({
      path: "Page1",
      frontMatter: { title: "Page 1" },
    });
    const page2 = createPage({
      path: "Page2",
      frontMatter: { title: "Page 2" },
    });
    const pages: Page[] = [];

    // Render first page and collapse
    const { rerender } = render(
      <CustomFieldsPanel
        page={page1}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    const toggleButton = screen.getByRole("button");
    const initialState = toggleButton.textContent?.includes("−");

    // Click to toggle
    await user.click(toggleButton);
    const toggledState = toggleButton.textContent?.includes("−");
    expect(toggledState).not.toBe(initialState);

    // Render second page - should have same state
    rerender(
      <CustomFieldsPanel
        page={page2}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    const toggleButton2 = screen.getByRole("button");
    const stateOnPage2 = toggleButton2.textContent?.includes("−");
    expect(stateOnPage2).toBe(toggledState);
  });

  it("shows schema fields when parent has schema", async () => {
    const user = userEvent.setup();
    const parent = createPage({
      path: "Parent",
      frontMatter: {
        __schema: [
          { name: "status", type: "text" },
          { name: "priority", type: "number" },
        ],
      },
    });
    const child = createPage({
      path: "Child",
      parent: "Parent",
      frontMatter: {
        status: "active",
        priority: 5,
      },
    });
    const pages: Page[] = [parent, child];

    render(
      <CustomFieldsPanel
        page={child}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Expand the panel first if it's collapsed
    const toggleButton = screen.getByRole("button");
    const isExpanded = toggleButton.textContent?.includes("−");
    if (!isExpanded) {
      await user.click(toggleButton);
    }

    expect(screen.getByText("status")).toBeInTheDocument();
    expect(screen.getByText("priority")).toBeInTheDocument();
  });

  it("shows all frontmatter fields as text editors when no schema", async () => {
    const user = userEvent.setup();
    const page = createPage({
      frontMatter: {
        title: "Test Title",
        status: "active",
        priority: "high",
        customField: "custom value",
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Expand the panel first if it's collapsed
    const toggleButton = screen.getByRole("button");
    const isExpanded = toggleButton.textContent?.includes("−");
    if (!isExpanded) {
      await user.click(toggleButton);
    }

    // Should show all fields as text editors
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("status")).toBeInTheDocument();
    expect(screen.getByText("priority")).toBeInTheDocument();
    expect(screen.getByText("customField")).toBeInTheDocument();

    // Should have text inputs for all fields
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(4);

    // Check that values are displayed
    const titleInput = screen.getByDisplayValue("Test Title");
    expect(titleInput).toBeInTheDocument();
  });

  it("allows editing frontmatter fields as text when no schema", async () => {
    const user = userEvent.setup();
    const page = createPage({
      frontMatter: {
        status: "active",
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Expand the panel first if it's collapsed
    const toggleButton = screen.getByRole("button");
    const isExpanded = toggleButton.textContent?.includes("−");
    if (!isExpanded) {
      await user.click(toggleButton);
    }

    const statusInput = screen.getByDisplayValue("active") as HTMLInputElement;
    expect(statusInput).toBeInTheDocument();

    // Edit the field
    await user.clear(statusInput);
    await user.type(statusInput, "inactive");

    // Wait for debounce/save
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockOnFieldChange).toHaveBeenCalledWith("status", "inactive");
  });

  it("shows __schema field when present", async () => {
    const user = userEvent.setup();
    const page = createPage({
      frontMatter: {
        title: "Test",
        status: "active",
        __schema: [{ name: "field", type: "text" }],
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Expand the panel first if it's collapsed
    const toggleButton = screen.getByRole("button");
    const isExpanded = toggleButton.textContent?.includes("−");
    if (!isExpanded) {
      await user.click(toggleButton);
    }

    // Should show all fields including __schema
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("status")).toBeInTheDocument();
    expect(screen.getByText("__schema")).toBeInTheDocument();
  });

  it("shows complex fields in compact format", async () => {
    const user = userEvent.setup();
    const page = createPage({
      frontMatter: {
        __schema: [{ name: "field", type: "text" }],
        tags: ["tag1", "tag2", "tag3"],
        metadata: { author: "John", version: 1 },
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Expand the panel
    const toggleButton = screen.getByRole("button");
    const isExpanded = toggleButton.textContent?.includes("−");
    if (!isExpanded) {
      await user.click(toggleButton);
    }

    // Should show complex fields in compact format
    expect(screen.getByText("[3 items]")).toBeInTheDocument(); // tags array
    expect(screen.getByText("{2 keys}")).toBeInTheDocument(); // metadata object
  });

  it("shows tooltip with full content for complex fields", async () => {
    const user = userEvent.setup();
    const page = createPage({
      frontMatter: {
        __schema: [
          { name: "status", type: "text" },
          { name: "priority", type: "number" },
        ],
      },
    });
    const pages: Page[] = [];

    render(
      <CustomFieldsPanel
        page={page}
        pages={pages}
        onFieldChange={mockOnFieldChange}
      />
    );

    // Expand the panel
    const toggleButton = screen.getByRole("button");
    const isExpanded = toggleButton.textContent?.includes("−");
    if (!isExpanded) {
      await user.click(toggleButton);
    }

    // Find the __schema field display
    const schemaField = screen.getByText("__schema").closest("div")?.querySelector('[role="button"]');
    expect(schemaField).toBeInTheDocument();

    // Hover over the complex field to show tooltip
    if (schemaField) {
      await user.hover(schemaField as HTMLElement);
      
      // Tooltip should show JSON content
      await new Promise((resolve) => setTimeout(resolve, 100));
      const tooltip = document.querySelector('.absolute.z-10');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.textContent).toContain("status");
      expect(tooltip?.textContent).toContain("priority");
    }
  });
});

