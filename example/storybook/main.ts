import type { StorybookConfig } from "@codegrowers/storybook-jaspr-vite";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  framework: {
    name: dirname(
      require.resolve("@codegrowers/storybook-jaspr-vite/package.json"),
    ),
    options: {
      entrypoint: "../lib/storybook.client.dart",
    },
  },
  stories: ["../stories/**/*.stories.ts"],
  addons: [dirname(require.resolve("@storybook/addon-docs/package.json"))],
};

export default config;
