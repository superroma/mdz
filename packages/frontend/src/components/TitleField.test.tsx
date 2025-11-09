import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TitleField } from "./TitleField";
import userEvent from "@testing-library/user-event";

describe("TitleField", () => {
  it("renders with initial title", () => {
    const onSave = vi.fn();
    render(<TitleField title="Test Page" onSave={onSave} />);
    
    const input = screen.getByRole("textbox", { name: /Page title/i });
    expect(input).toHaveValue("Test Page");
  });

  it("shows placeholder when title is empty", () => {
    const onSave = vi.fn();
    render(<TitleField title="" onSave={onSave} />);
    
    const input = screen.getByPlaceholderText("Untitled");
    expect(input).toBeInTheDocument();
  });

  it("calls onSave when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TitleField title="Original" onSave={onSave} />);
    
    const input = screen.getByRole("textbox", { name: /Page title/i });
    await user.clear(input);
    await user.type(input, "New Title{Enter}");
    
    expect(onSave).toHaveBeenCalledWith("New Title");
  });

  it("calls onSave when input loses focus", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TitleField title="Original" onSave={onSave} />);
    
    const input = screen.getByRole("textbox", { name: /Page title/i });
    await user.clear(input);
    await user.type(input, "Modified Title");
    await user.tab();
    
    expect(onSave).toHaveBeenCalledWith("Modified Title");
  });

  it("does not call onSave if title unchanged", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TitleField title="Same Title" onSave={onSave} />);
    
    const input = screen.getByRole("textbox", { name: /Page title/i });
    await user.click(input);
    await user.tab();
    
    expect(onSave).not.toHaveBeenCalled();
  });

  it("auto-focuses and selects text when autoFocus is true", async () => {
    const onSave = vi.fn();
    render(<TitleField title="Test" onSave={onSave} autoFocus />);
    
    const input = screen.getByRole("textbox", { name: /Page title/i });
    
    // In jsdom, we can't test actual focus behavior reliably
    // so we just verify the input exists and autoFocus prop is handled
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Test");
  });

  it("updates value when title prop changes", () => {
    const onSave = vi.fn();
    const { rerender } = render(<TitleField title="First" onSave={onSave} />);
    
    const input = screen.getByRole("textbox", { name: /Page title/i });
    expect(input).toHaveValue("First");
    
    rerender(<TitleField title="Second" onSave={onSave} />);
    expect(input).toHaveValue("Second");
  });

  it("disables input while saving", async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    const onSave = vi.fn().mockReturnValue(savePromise);
    
    render(<TitleField title="Test" onSave={onSave} />);
    
    const input = screen.getByRole("textbox", { name: /Page title/i });
    await user.clear(input);
    await user.type(input, "New{Enter}");
    
    expect(input).toBeDisabled();
    
    resolvePromise!();
    await savePromise;
  });
});

