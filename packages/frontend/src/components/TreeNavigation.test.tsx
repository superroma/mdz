import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { TreeNavigation } from "./TreeNavigation";
import type { Page } from "../types";
import userEvent from "@testing-library/user-event";

const mockPages: Page[] = [
  {
    path: "Welcome",
    title: "Welcome",
    content: "Welcome content",
    frontMatter: {},
    children: [],
  },
  {
    path: "Welcome/Tasks",
    title: "Tasks",
    content: "Tasks content",
    frontMatter: {},
    children: ["Welcome/Tasks/Task1", "Welcome/Tasks/Task2"],
    parent: "Welcome",
  },
  {
    path: "Welcome/Tasks/Task1",
    title: "Task1",
    content: "Task1 content",
    frontMatter: {},
    children: [],
    parent: "Welcome/Tasks",
  },
  {
    path: "Welcome/Tasks/Task2",
    title: "Task2",
    content: "Task2 content",
    frontMatter: {},
    children: [],
    parent: "Welcome/Tasks",
  },
];

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

function renderWithRoute(ui: React.ReactElement, initialEntries: string[] = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
}

describe("TreeNavigation", () => {
  it("renders empty state when no pages", () => {
    const onCreateChild = vi.fn();
    renderWithRouter(<TreeNavigation pages={[]} onCreateChild={onCreateChild} />);
    expect(screen.getByText("No pages yet")).toBeInTheDocument();
  });

  it("renders all root pages", () => {
    const onCreateChild = vi.fn();
    renderWithRouter(<TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />);
    
    expect(screen.getByRole("button", { name: /Navigate to Welcome/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Navigate to Tasks/i })).toBeInTheDocument();
  });

  it("renders child pages under parent", () => {
    const onCreateChild = vi.fn();
    renderWithRouter(<TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />);
    
    expect(screen.getByRole("button", { name: /Navigate to Task1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Navigate to Task2/i })).toBeInTheDocument();
  });

  it("calls onCreateChild when add button clicked", async () => {
    const user = userEvent.setup();
    const onCreateChild = vi.fn();
    renderWithRouter(<TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />);
    
    const addButton = screen.getByRole("button", { name: /Add child page to Welcome/i });
    await user.click(addButton);
    
    expect(onCreateChild).toHaveBeenCalledWith("Welcome");
  });

  it("applies correct indentation for nested pages", () => {
    const onCreateChild = vi.fn();
    const { container } = renderWithRouter(
      <TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />
    );
    
    const task1Button = screen.getByRole("button", { name: /Navigate to Task1/i });
    const styledDiv = task1Button.closest("div.group");
    expect(styledDiv).toHaveStyle({ paddingLeft: "44px" }); // Tasks is level 1, Task1 is level 2: 2 * 16 + 12 = 44px
  });

  it("marks current page as selected when route matches page path", () => {
    const onCreateChild = vi.fn();
    const { container } = renderWithRoute(
      <TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />,
      ["/Welcome"]
    );
    
    const welcomeButton = screen.getByRole("button", { name: /Navigate to Welcome/i });
    const welcomeRow = welcomeButton.closest("div.group");
    expect(welcomeRow).toHaveClass("bg-slate-200", "border-l-2", "border-sky-500");
  });

  it("marks nested page as selected when route matches nested page path", () => {
    const onCreateChild = vi.fn();
    const { container } = renderWithRoute(
      <TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />,
      ["/Welcome/Tasks/Task1"]
    );
    
    const task1Button = screen.getByRole("button", { name: /Navigate to Task1/i });
    const task1Row = task1Button.closest("div.group");
    expect(task1Row).toHaveClass("bg-slate-200", "border-l-2", "border-sky-500");
  });

  it("does not mark page as selected when route does not match", () => {
    const onCreateChild = vi.fn();
    const { container } = renderWithRoute(
      <TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />,
      ["/Welcome"]
    );
    
    const tasksButton = screen.getByRole("button", { name: /Navigate to Tasks/i });
    const tasksRow = tasksButton.closest("div.group");
    expect(tasksRow).not.toHaveClass("bg-slate-200", "border-l-2", "border-sky-500");
  });

  it("shows '+' button when page is selected", () => {
    const onCreateChild = vi.fn();
    renderWithRoute(
      <TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />,
      ["/Welcome"]
    );
    
    const addButton = screen.getByRole("button", { name: /Add child page to Welcome/i });
    expect(addButton).toBeVisible();
  });

  it("shows '+' button for selected nested page", () => {
    const onCreateChild = vi.fn();
    renderWithRoute(
      <TreeNavigation pages={mockPages} onCreateChild={onCreateChild} />,
      ["/Welcome/Tasks"]
    );
    
    const addButton = screen.getByRole("button", { name: /Add child page to Tasks/i });
    expect(addButton).toBeVisible();
  });
});

