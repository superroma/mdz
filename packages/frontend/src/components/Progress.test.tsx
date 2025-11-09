import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("renders a progress bar with value", () => {
    render(<Progress value={50} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
  });

  it("renders with label", () => {
    render(<Progress value={75} label="Backend Development" />);
    expect(screen.getByText("Backend Development")).toBeInTheDocument();
  });

  it("shows percentage by default", () => {
    render(<Progress value={60} label="Testing" />);
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("hides percentage when showPercent is false", () => {
    render(<Progress value={60} label="Testing" showPercent={false} />);
    expect(screen.queryByText("60%")).not.toBeInTheDocument();
  });

  it("applies correct color class", () => {
    const { container } = render(<Progress value={50} color="green" />);
    const progressFill = container.querySelector(".bg-green-500");
    expect(progressFill).toBeInTheDocument();
  });

  it("defaults to blue color", () => {
    const { container } = render(<Progress value={50} />);
    const progressFill = container.querySelector(".bg-blue-500");
    expect(progressFill).toBeInTheDocument();
  });

  it("clamps value to 0-100 range", () => {
    const { rerender } = render(<Progress value={150} />);
    let progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");

    rerender(<Progress value={-50} />);
    progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
  });

  it("sets width style based on value", () => {
    const { container } = render(<Progress value={75} />);
    const progressFill = container.querySelector(".transition-all");
    expect(progressFill).toHaveStyle({ width: "75%" });
  });

  it("renders without label", () => {
    render(<Progress value={50} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    // Should show percentage
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
