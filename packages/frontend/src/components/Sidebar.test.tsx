import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import type { Page } from "../types";
import userEvent from "@testing-library/user-event";

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

const mockPages: Page[] = [
  {
    path: "Welcome",
    title: "Welcome",
    content: "",
    frontMatter: {},
    children: [],
    isHidden: false,
    isMarkdown: true,
  },
  {
    path: "Welcome/Tasks",
    title: "Tasks",
    content: "",
    frontMatter: {},
    children: ["Welcome/Tasks/Task1"],
    isHidden: false,
    isMarkdown: true,
  },
  {
    path: ".hidden-page",
    title: ".hidden-page",
    content: "",
    frontMatter: {},
    children: [],
    isHidden: true,
    isMarkdown: true,
  },
];

describe("Sidebar", () => {
  it("renders Pages heading", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    expect(screen.getByRole("heading", { name: "Pages" })).toBeInTheDocument();
  });

  it("renders create new page button", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    expect(screen.getByRole("button", { name: "Create new page" })).toBeInTheDocument();
  });

  it("calls onCreateRoot when + button clicked", async () => {
    const user = userEvent.setup();
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    const createButton = screen.getByRole("button", { name: "Create new page" });
    await user.click(createButton);
    
    expect(onCreateRoot).toHaveBeenCalledTimes(1);
  });

  it("renders TreeNavigation with pages", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    expect(screen.getByRole("button", { name: /Navigate to Welcome/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Navigate to Tasks/i })).toBeInTheDocument();
  });

  it("is visible when isOpen is true on mobile", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    const { container } = renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("translate-x-0");
  });

  it("is hidden when isOpen is false on mobile", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    const { container } = renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={false} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("-translate-x-full");
  });

  it("has correct styling classes", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    const { container } = renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("bg-slate-50", "border-r", "border-slate-200");
  });

  it("passes onCreateChild to TreeNavigation", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    const addChildButton = screen.getByRole("button", { name: /Add child page to Welcome/i });
    expect(addChildButton).toBeInTheDocument();
  });

  it("renders toggle hidden files button", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    expect(screen.getByRole("button", { name: "Toggle hidden files" })).toBeInTheDocument();
  });

  it("calls onToggleShowHidden when toggle button clicked", async () => {
    const user = userEvent.setup();
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    const toggleButton = screen.getByRole("button", { name: "Toggle hidden files" });
    await user.click(toggleButton);
    
    expect(onToggleShowHidden).toHaveBeenCalledTimes(1);
  });

  it("filters out hidden pages when showHidden is false", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={false} onToggleShowHidden={onToggleShowHidden} />
    );
    
    expect(screen.getByRole("button", { name: /Navigate to Welcome/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Navigate to \.hidden-page/i })).not.toBeInTheDocument();
  });

  it("shows hidden pages when showHidden is true", () => {
    const onCreateRoot = vi.fn();
    const onCreateChild = vi.fn();
    const onToggleShowHidden = vi.fn();
    renderWithRouter(
      <Sidebar pages={mockPages} onCreateRoot={onCreateRoot} onCreateChild={onCreateChild} isOpen={true} showHidden={true} onToggleShowHidden={onToggleShowHidden} />
    );
    
    expect(screen.getByRole("button", { name: /Navigate to Welcome/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Navigate to \.hidden-page/i })).toBeInTheDocument();
  });
});

