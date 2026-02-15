import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar";
import type { Page } from "../types";

const meta: Meta<typeof Sidebar> = {
  component: Sidebar,
  decorators: [
    (Story) => (
      <div style={{ height: "500px", position: "relative", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

const rootPages: Page[] = [
  {
    path: "Welcome",
    title: "Welcome",
    content: "",
    frontMatter: {},
    children: ["Welcome/Getting Started", "Welcome/FAQ"],
    isMarkdown: true,
  },
  {
    path: "Welcome/Getting Started",
    title: "Getting Started",
    content: "",
    frontMatter: {},
    children: [],
    parent: "Welcome",
    isMarkdown: true,
  },
  {
    path: "Welcome/FAQ",
    title: "FAQ",
    content: "",
    frontMatter: {},
    children: [],
    parent: "Welcome",
    isMarkdown: true,
  },
  {
    path: "Components",
    title: "Components",
    content: "",
    frontMatter: {},
    children: ["Components/Button", "Components/Avatar"],
    isMarkdown: true,
  },
  {
    path: "Components/Button",
    title: "Button",
    content: "",
    frontMatter: {},
    children: [],
    parent: "Components",
    isMarkdown: true,
  },
  {
    path: "Components/Avatar",
    title: "Avatar",
    content: "",
    frontMatter: {},
    children: [],
    parent: "Components",
    isMarkdown: true,
  },
  {
    path: "Changelog",
    title: "Changelog",
    content: "",
    frontMatter: {},
    children: [],
    isMarkdown: true,
  },
];

export const Default: Story = {
  args: {
    visiblePages: rootPages,
    isOpen: true,
    showHidden: false,
    onCreateRoot: () => {},
    onCreateChild: () => {},
    onClose: () => {},
    onToggleShowHidden: () => {},
  },
};

export const Empty: Story = {
  args: {
    visiblePages: [],
    isOpen: true,
    showHidden: false,
    onCreateRoot: () => {},
    onCreateChild: () => {},
    onClose: () => {},
    onToggleShowHidden: () => {},
  },
};

export const WithHiddenFiles: Story = {
  args: {
    visiblePages: [
      ...rootPages,
      {
        path: ".env",
        title: ".env",
        content: "",
        frontMatter: {},
        children: [],
        isHidden: true,
        isMarkdown: true,
      },
      {
        path: ".gitignore",
        title: ".gitignore",
        content: "",
        frontMatter: {},
        children: [],
        isHidden: true,
        isMarkdown: true,
      },
      {
        path: "logo.png",
        title: "logo.png",
        content: "",
        frontMatter: {},
        children: [],
        isMarkdown: false,
      },
    ],
    isOpen: true,
    showHidden: true,
    onCreateRoot: () => {},
    onCreateChild: () => {},
    onClose: () => {},
    onToggleShowHidden: () => {},
  },
};

export const ManyPages: Story = {
  args: {
    visiblePages: [
      {
        path: "Project",
        title: "Project",
        content: "",
        frontMatter: {},
        children: Array.from({ length: 8 }, (_, i) => `Project/Page ${i + 1}`),
        isMarkdown: true,
      },
      ...Array.from({ length: 8 }, (_, i) => ({
        path: `Project/Page ${i + 1}`,
        title: `Page ${i + 1}`,
        content: "",
        frontMatter: {},
        children: [] as string[],
        parent: "Project",
        isMarkdown: true,
      })),
      {
        path: "Notes",
        title: "Notes",
        content: "",
        frontMatter: {},
        children: [],
        isMarkdown: true,
      },
      {
        path: "Archive",
        title: "Archive",
        content: "",
        frontMatter: {},
        children: [],
        isMarkdown: true,
      },
    ],
    isOpen: true,
    showHidden: false,
    onCreateRoot: () => {},
    onCreateChild: () => {},
    onClose: () => {},
    onToggleShowHidden: () => {},
  },
};
