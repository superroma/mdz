import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Sidebar",
  component: Sidebar,
};
export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Basic: Story = {
  render: () => (
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  ),
};
