import type { Preview } from "@storybook/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import "../packages/frontend/src/index.css";

const preview: Preview = {
  decorators: [
    (Story) => React.createElement(MemoryRouter, null, React.createElement(Story)),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      defaultViewport: "responsive",
    },
  },
};

export default preview;
