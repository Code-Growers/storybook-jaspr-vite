import type { PresetProperty } from "storybook/internal/types";
import type { ViteFinal } from "@storybook/builder-vite";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { mergeConfig, searchForWorkspaceRoot } from "vite";
import { dartPreviewPlugin } from "./vite-plugin.js";
import type { FrameworkOptions } from "./types.js";

export const core: PresetProperty<"core"> = {
  builder: import.meta.resolve("@storybook/builder-vite"),
  renderer: import.meta.resolve("./renderer-preset.js"),
};

export const managerEntries = (entries: string[] = []) => [
  ...entries,
  fileURLToPath(import.meta.resolve("./dart-highlighting.js")),
];

export const viteFinal: ViteFinal = async (config, options) => {
  const framework = await options.presets.apply<{ options?: FrameworkOptions }>(
    "framework",
  );
  if (!framework.options?.entrypoint) {
    throw new Error(
      "Jaspr Storybook requires framework.options.entrypoint relative to the config directory.",
    );
  }
  return mergeConfig(config, {
    plugins: [dartPreviewPlugin(framework.options, options.configDir)],
    server: {
      fs: {
        // Bun may install Storybook outside a nested consumer workspace. Its
        // injected mock bootstrap still needs to pass Vite's strict file checks.
        allow: [
          ...(config.server?.fs?.allow ?? [
            searchForWorkspaceRoot(config.root ?? process.cwd()),
          ]),
          dirname(fileURLToPath(import.meta.resolve("storybook/package.json"))),
        ],
      },
    },
  });
};
