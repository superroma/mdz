import type { Meta, StoryObj } from "@storybook/react";
import { BoardView } from "./BoardView";

const meta: Meta<typeof BoardView> = {
  component: BoardView,
  args: {
    parentPath: "Components/README",
  },
};
export default meta;

type Story = StoryObj<typeof BoardView>;

export const GroupByStatus: Story = {
  args: { groupBy: "status" },
};

export const GroupByPriority: Story = {
  args: { groupBy: "priority" },
};

export const GroupByCategory: Story = {
  args: { groupBy: "category" },
};

export const WithSort: Story = {
  args: { groupBy: "status", sort: "priority" },
};

export const WithFilter: Story = {
  args: {
    groupBy: "status",
    filter: { status: { $ne: "Done" } },
  },
};
