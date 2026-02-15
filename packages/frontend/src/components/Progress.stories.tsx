import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./Progress";

const meta: Meta<typeof Progress> = {
  component: Progress,
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: { value: 50 },
};

export const WithLabel: Story = {
  args: { value: 75, label: "Sprint progress" },
};

export const Blue: Story = {
  args: { value: 60, label: "Blue", color: "blue" },
};

export const Green: Story = {
  args: { value: 80, label: "Green", color: "green" },
};

export const Orange: Story = {
  args: { value: 45, label: "Orange", color: "orange" },
};

export const Red: Story = {
  args: { value: 90, label: "Red", color: "red" },
};

export const NoPercent: Story = {
  args: { value: 50, label: "No percent", showPercent: false },
};

export const Empty: Story = {
  args: { value: 0, label: "Not started" },
};

export const Full: Story = {
  args: { value: 100, label: "Complete", color: "green" },
};

export const AllColors: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Progress value={60} label="Blue" color="blue" />
      <Progress value={80} label="Green" color="green" />
      <Progress value={45} label="Orange" color="orange" />
      <Progress value={90} label="Red" color="red" />
    </div>
  ),
};
