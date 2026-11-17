import type { PresetProperty } from "storybook/internal/types";
import type { ViteFinal } from "@storybook/builder-vite";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { mergeConfig, searchForWorkspaceRoot } from "vite";
import { dartPreviewPlugin } from "./vite-plugin.js";
import type { FrameworkOptions } from "./types.js";
import { storyDocsProvider } from "./story-docs.js";
import type {
  Options,
  StoryDocsProviderPreset,
} from "storybook/internal/types";
import { importParsers } from "./import-parsers.js";

async function metadataOptions(options: Options) {
  const framework = await options.presets.apply<{ options: FrameworkOptions }>(
    "framework",
  );
  return {
    ...framework.options,
    configDir: options.configDir,
    workingDir: process.cwd(),
  };
}

export const features: PresetProperty<"features"> = (features) => ({
  ...features,
  docgenServer: true,
});

export const experimental_docgenProvider: PresetProperty<
  "experimental_docgenProvider"
> = async (providers = [], options) => [
  ...providers,
  {
    moduleSpecifier: fileURLToPath(import.meta.resolve("./docgen.js")),
    options: await metadataOptions(options),
  },
];

export const experimental_storyDocsProvider: StoryDocsProviderPreset = async (
  next,
  options,
) => storyDocsProvider(next, await metadataOptions(options));

export const experimental_importParsers = async (
  parsers: ReturnType<typeof importParsers> = [],
  options: Options,
) => [...parsers, ...importParsers(await metadataOptions(options))];

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
