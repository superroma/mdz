import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ContentEditor } from "./ContentEditor";

// Wrapper component with Router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("ContentEditor", () => {
  it("renders MDXEditor with toolbar", () => {
    const onSave = vi.fn();
    renderWithRouter(<ContentEditor content="Test content" onSave={onSave} />);
    
    // MDXEditor should render with a toolbar
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("renders content without frontmatter", () => {
    const onSave = vi.fn();
    const contentWithFrontmatter = "---\ntitle: Test\n---\nTest content";
    renderWithRouter(<ContentEditor content={contentWithFrontmatter} onSave={onSave} />);
    
    // MDXEditor should render (toolbar is always present)
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("renders empty editor when no content", () => {
    const onSave = vi.fn();
    renderWithRouter(<ContentEditor content="" onSave={onSave} />);
    
    // Editor should still render with toolbar
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("renders editor when only frontmatter exists", () => {
    const onSave = vi.fn();
    const contentWithOnlyFrontmatter = "---\ntitle: Test\n---\n";
    renderWithRouter(<ContentEditor content={contentWithOnlyFrontmatter} onSave={onSave} />);
    
    // Editor should still render with toolbar
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("shows auto-saving message", () => {
    const onSave = vi.fn();
    renderWithRouter(<ContentEditor content="Test" onSave={onSave} />);
    
    expect(screen.getByText(/Auto-saving enabled/i)).toBeInTheDocument();
  });

  it("has undo and redo buttons in toolbar", () => {
    const onSave = vi.fn();
    renderWithRouter(<ContentEditor content="Test" onSave={onSave} />);
    
    // Check for undo/redo buttons
    expect(screen.getByLabelText(/Undo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Redo/i)).toBeInTheDocument();
  });

  it("has formatting buttons in toolbar", () => {
    const onSave = vi.fn();
    renderWithRouter(<ContentEditor content="Test" onSave={onSave} />);
    
    // Check for formatting buttons
    expect(screen.getByLabelText(/Bold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Italic/i)).toBeInTheDocument();
  });

  it("has link button in toolbar", () => {
    const onSave = vi.fn();
    renderWithRouter(<ContentEditor content="Test" onSave={onSave} />);
    
    // Check for link button
    expect(screen.getByLabelText(/Create link/i)).toBeInTheDocument();
  });

  it("has list toggle buttons in toolbar", () => {
    const onSave = vi.fn();
    renderWithRouter(<ContentEditor content="Test" onSave={onSave} />);
    
    // Check for list buttons
    expect(screen.getByLabelText(/Bulleted list/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Numbered list/i)).toBeInTheDocument();
  });

  it("has block type selector in toolbar", () => {
    const onSave = vi.fn();
    renderWithRouter(<ContentEditor content="Test" onSave={onSave} />);
    
    // Check for block type selector
    expect(screen.getByLabelText(/Block type/i)).toBeInTheDocument();
  });

  it("renders with editor wrapper styles", () => {
    const onSave = vi.fn();
    const { container } = renderWithRouter(<ContentEditor content="Test" onSave={onSave} />);
    
    // Check that the editor container has the expected classes
    const editorContainer = container.querySelector('.bg-slate-800');
    expect(editorContainer).toBeInTheDocument();
  });
});

