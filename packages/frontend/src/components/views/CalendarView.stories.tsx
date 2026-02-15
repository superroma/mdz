import type { Meta, StoryObj } from "@storybook/react";
import { CalendarView } from "./CalendarView";

const meta: Meta<typeof CalendarView> = {
  component: CalendarView,
  args: {
    parentPath: "Components/README",
    dateField: "due_date",
  },
};
export default meta;

type Story = StoryObj<typeof CalendarView>;

export const Default: Story = {};

export const Filtered: Story = {
  args: {
    filter: { status: { $ne: "Done" } },
  },
};
