import baseConfig from "../packages/frontend/tailwind.config";
import type { Config } from "tailwindcss";
import { join } from "path";

const config: Config = {
  ...baseConfig,
  content: [
    join(__dirname, "../packages/frontend/src/**/*.{ts,tsx}"),
  ],
};

export default config;
