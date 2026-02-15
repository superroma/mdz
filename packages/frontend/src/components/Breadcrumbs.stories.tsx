import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumbs } from "./Breadcrumbs";
import type { Page } from "../types";

const mockPages: Page[] = [
  {
    path: "Welcome",
    title: "Welcome",
    content: "",
    frontMatter: {},
    children: ["Welcome/Tasks"],
  },
  {
    path: "Welcome/Tasks",
    title: "Tasks",
    content: "",
    frontMatter: {},
    children: ["Welcome/Tasks/Write Tests"],
    parent: "Welcome",
  },
  {
    path: "Welcome/Tasks/Write Tests",
    title: "Write Tests",
    content: "",
    frontMatter: {},
    children: [],
    parent: "Welcome/Tasks",
  },
];

const meta: Meta<typeof Breadcrumbs> = {
  component: Breadcrumbs,
  args: {
    pages: mockPages,
  },
};
export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const SingleLevel: Story = {
  args: {
    currentPath: "Welcome",
  },
};

export const TwoLevels: Story = {
  args: {
    currentPath: "Welcome/Tasks",
  },
};

export const ThreeLevels: Story = {
  args: {
    currentPath: "Welcome/Tasks/Write Tests",
  },
};

export const PageNotFound: Story = {
  args: {
    currentPath: "NonExistent",
  },
};
