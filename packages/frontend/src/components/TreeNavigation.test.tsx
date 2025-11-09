import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
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
    const parentDiv = task1Button.closest("div");
    expect(parentDiv).toHaveStyle({ paddingLeft: "28px" });
  });
});

