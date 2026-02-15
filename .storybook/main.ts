import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, "../packages/frontend");

const config: StorybookConfig = {
  stories: [
    "../packages/frontend/src/**/*.stories.@(ts|tsx)",
  ],
  framework: "@storybook/react-vite",
  addons: [
    "@storybook/addon-a11y",
  ],
  viteFinal: async (config) => {
    if (process.env.STORYBOOK_BASE) {
      config.base = process.env.STORYBOOK_BASE;
    }

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      [path.resolve(__dirname, "../packages/frontend/src/api/client")]:
        path.resolve(__dirname, "mocks/api-client.ts"),
      api: path.resolve(__dirname, "../packages/frontend/src/api"),
      components: path.resolve(__dirname, "../packages/frontend/src/components"),
      lib: path.resolve(__dirname, "../packages/frontend/src/lib"),
      store: path.resolve(__dirname, "../packages/frontend/src/store"),
      types: path.resolve(__dirname, "../packages/frontend/src/types"),
      utils: path.resolve(__dirname, "../packages/frontend/src/utils"),
      constants: path.resolve(__dirname, "../packages/frontend/src/constants"),
    };

    config.css = config.css || {};
    config.css.postcss = {
      plugins: [
        tailwindcss({
          config: path.resolve(__dirname, "tailwind.config.ts"),
        }),
        autoprefixer(),
      ],
    };

    return config;
  },
};

export default config;
