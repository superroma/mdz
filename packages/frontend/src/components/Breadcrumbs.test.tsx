import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Breadcrumbs } from "./Breadcrumbs";
import type { Page } from "../types";
import userEvent from "@testing-library/user-event";
import { ARIA_LABELS } from "../constants/aria-labels";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ "*": "Welcome/Tasks/Write Tests" }),
  };
});

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
  },
  {
    path: "Welcome/Tasks",
    title: "Tasks",
    content: "",
    frontMatter: {},
    children: ["Welcome/Tasks/Write Tests"],
    parent: "Welcome",
  },
  {
    path: "Welcome/Tasks/Write Tests",
    title: "Write Tests",
    content: "",
    frontMatter: {},
    children: [],
    parent: "Welcome/Tasks",
  },
];

describe("Breadcrumbs", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders single breadcrumb for root page", () => {
    renderWithRouter(<Breadcrumbs pages={mockPages} currentPath="Welcome" />);
    
    expect(screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Welcome") })).toBeInTheDocument();
    expect(screen.queryByText("/")).not.toBeInTheDocument();
  });

  it("renders breadcrumbs with separator for nested page", () => {
    renderWithRouter(<Breadcrumbs pages={mockPages} currentPath="Welcome/Tasks/Write Tests" />);
    
    expect(screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Welcome") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Tasks") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Write Tests") })).toBeInTheDocument();
    expect(screen.getAllByText("/").length).toBeGreaterThan(0);
  });

  it("navigates to parent when parent breadcrumb clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Breadcrumbs pages={mockPages} currentPath="Welcome/Tasks/Write Tests" />);
    
    const tasksButton = screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Tasks") });
    await user.click(tasksButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/Welcome/Tasks");
  });

  it("navigates to current page when clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Breadcrumbs pages={mockPages} currentPath="Welcome/Tasks/Write Tests" />);
    
    const currentButton = screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Write Tests") });
    await user.click(currentButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/Welcome/Tasks/Write Tests");
  });

  it("renders empty when page not found", () => {
    const { container } = renderWithRouter(
      <Breadcrumbs pages={mockPages} currentPath="NonExistent" />
    );
    
    expect(container.querySelector("nav")).toBeEmptyDOMElement();
  });

  it("has correct ARIA label", () => {
    renderWithRouter(<Breadcrumbs pages={mockPages} currentPath="Welcome/Tasks" />);
    
    const nav = screen.getByRole("navigation", { name: ARIA_LABELS.breadcrumbNavigation });
    expect(nav).toBeInTheDocument();
  });

  it("builds correct breadcrumb path for deeply nested pages", () => {
    const deepPages: Page[] = [
      ...mockPages,
      {
        path: "Welcome/Tasks/Write Tests/Unit Tests",
        title: "Unit Tests",
        content: "",
        frontMatter: {},
        children: [],
        parent: "Welcome/Tasks/Write Tests",
      },
    ];
    
    renderWithRouter(<Breadcrumbs pages={deepPages} currentPath="Welcome/Tasks/Write Tests/Unit Tests" />);
    
    expect(screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Welcome") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Tasks") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Write Tests") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ARIA_LABELS.navigateTo("Unit Tests") })).toBeInTheDocument();
  });
});

