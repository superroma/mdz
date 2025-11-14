import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders no page selected message", () => {
    render(<EmptyState />);
    
    expect(screen.getByText("No page selected")).toBeInTheDocument();
  });

  it("renders instruction text", () => {
    render(<EmptyState />);
    
    expect(screen.getByText(/Select a page from the sidebar or create a new one/i)).toBeInTheDocument();
  });

  it("has centered layout", () => {
    const { container } = render(<EmptyState />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("flex-1", "flex", "items-center", "justify-center");
  });

  it("uses appropriate text colors", () => {
    render(<EmptyState />);
    
    const heading = screen.getByText("No page selected");
    const subtext = screen.getByText(/Select a page from the sidebar/i);
    
    expect(heading).toHaveClass("text-slate-600");
    expect(subtext).toHaveClass("text-slate-500");
  });
});

