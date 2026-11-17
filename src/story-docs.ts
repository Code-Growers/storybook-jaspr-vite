import type { StoryDocsProvider, StoryDoc } from "storybook/internal/types";
import {
  readComponent,
  readExamples,
  type MetadataOptions,
} from "./metadata.js";

export function storyDocsProvider(
  next: StoryDocsProvider,
  options: MetadataOptions,
): StoryDocsProvider {
  return async (input) => {
    const component = await readComponent(input.entry, options);
    if (!component) return next(input);
    const { csf, metadata, key, id, meta } = component;
    const examples = await readExamples(options);
    const stories: Record<string, StoryDoc> = {};
    for (const story of csf.stories) {
      const found = csf.storyObject(story.exportName);
      const object = found?.ok ? found.object : undefined;
      const override =
        object?.getValue(["parameters", "docs", "source", "code"]) ??
        meta?.getValue(["parameters", "docs", "source", "code"]);
      const description = object?.getValue([
        "parameters",
        "docs",
        "description",
        "story",
      ]);
      const code =
        typeof override === "string"
          ? override
          : (metadata?.exampleCode ?? examples[key]);
      stories[story.id] = {
        id: story.id,
        name: story.name,
        snippet: code
          ? [metadata?.import, code].filter(Boolean).join("\n\n")
          : undefined,
        description: typeof description === "string" ? description : undefined,
        warning:
          typeof override === "string"
            ? undefined
            : code
              ? "Dart fixture source; story args select this variant. StorybookContext is a fixture adapter, not application state."
              : "No Dart source region or explicit source example is configured.",
      };
    }
    return {
      ...(await next(input)),
      id,
      name: metadata?.name ?? key,
      path: input.entry.importPath,
      stories,
    };
  };
}
