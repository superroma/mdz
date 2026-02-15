import type { Meta, StoryObj } from "@storybook/react";
import { ListView } from "./ListView";

const meta: Meta<typeof ListView> = {
  component: ListView,
  args: {
    parentPath: "Components/README",
  },
};
export default meta;

type Story = StoryObj<typeof ListView>;

export const Default: Story = {};

export const WithFields: Story = {
  args: { fields: ["status", "priority", "category"] },
};

export const Sorted: Story = {
  args: { fields: ["status", "priority"], sort: "-due_date" },
};

export const Filtered: Story = {
  args: {
    fields: ["status", "priority"],
    filter: { priority: "High" },
  },
};
