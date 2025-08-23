import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { Sidebar } from "./sidebar";

test("Sidebar renders tree items", async () => {
  vi.spyOn(global, "fetch" as any).mockResolvedValue({
    ok: true,
    json: async () => [{ path: "Welcome", title: "Welcome", children: [] }],
  } as any);
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
  expect(
    await screen.findByRole("button", { name: /open welcome/i })
  ).toBeInTheDocument();
});
