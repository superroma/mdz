import type { Meta, StoryObj } from "@storybook/react";
import { GridView } from "./GridView";

const meta: Meta<typeof GridView> = {
  component: GridView,
  args: {
    parentPath: "Components/README",
  },
};
export default meta;

type Story = StoryObj<typeof GridView>;

export const AllColumns: Story = {};

export const SelectedColumns: Story = {
  args: { columns: ["status", "priority"] },
};

export const WithSort: Story = {
  args: { sort: "due_date" },
};

export const WithFilter: Story = {
  args: {
    columns: ["status", "priority", "due_date"],
    filter: { status: { $ne: "Done" } },
    sort: "due_date",
  },
};
