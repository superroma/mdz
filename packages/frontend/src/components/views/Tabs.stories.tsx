import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, Tab } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  component: Tabs,
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const TwoTabs: Story = {
  render: () => (
    <Tabs>
      <Tab name="First">
        <p>Content of the first tab.</p>
      </Tab>
      <Tab name="Second">
        <p>Content of the second tab.</p>
      </Tab>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs>
      <Tab name="Overview">
        <p>Overview content goes here.</p>
      </Tab>
      <Tab name="Details">
        <p>Detailed information about the item.</p>
      </Tab>
      <Tab name="Settings">
        <p>Configuration options.</p>
      </Tab>
    </Tabs>
  ),
};

export const WithRichContent: Story = {
  render: () => (
    <Tabs>
      <Tab name="Text">
        <div>
          <h3 className="text-lg font-semibold mb-2">Rich Content</h3>
          <p className="text-slate-600">This tab has rich content with headings and styled text.</p>
        </div>
      </Tab>
      <Tab name="List">
        <ul className="list-disc pl-5 space-y-1">
          <li>Item one</li>
          <li>Item two</li>
          <li>Item three</li>
        </ul>
      </Tab>
    </Tabs>
  ),
};
