import type { Preview } from "@storybook/react";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "../packages/frontend/src/index.css";

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const routerParams = context.parameters.reactRouter;
      if (routerParams) {
        return React.createElement(
          MemoryRouter,
          { initialEntries: routerParams.initialEntries },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: routerParams.routePath,
              element: React.createElement(Story),
            }),
          ),
        );
      }
      return React.createElement(MemoryRouter, null, React.createElement(Story));
    },
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
