import type {
  Args,
  ComponentAnnotations,
  StoryAnnotations,
  WebRenderer,
  StorybookConfigRaw,
} from "storybook/internal/types";
import type { StorybookConfigVite } from "@storybook/builder-vite";

export interface JasprStory {
  component: string;
  args: Args;
}

export interface JasprRenderer extends WebRenderer {
  component: string;
  storyResult: JasprStory;
}

export type Meta<TArgs extends Args = Args> = ComponentAnnotations<
  JasprRenderer,
  TArgs
>;
export type StoryObj<TArgs extends Args = Args> = StoryAnnotations<
  JasprRenderer,
  TArgs
>;

export interface FrameworkOptions {
  /** Dart client entrypoint, relative to the Storybook config directory. */
  entrypoint: string;
  /** SDK executable. Defaults to dart on PATH. */
  dartExecutable?: string;
  /** Additional Dart directories to watch, relative to the config directory. */
  watchPaths?: string[];
  /** Dart files with #docregion markers keyed by registered component name. */
  sourceFiles?: string[];
}

export type StorybookConfig = Omit<StorybookConfigRaw, "framework"> &
  StorybookConfigVite & {
    framework: {
      name: string;
      options: FrameworkOptions;
    };
  };
