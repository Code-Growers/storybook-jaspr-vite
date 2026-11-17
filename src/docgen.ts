import type { DocgenWorkerModule } from "storybook/internal/types";
import { readComponent, type MetadataOptions } from "./metadata.js";

export const createDocgenProvider: DocgenWorkerModule<MetadataOptions>["createDocgenProvider"] =
  (options) => {
    if (!options) throw new Error("Jaspr docgen requires framework options.");
    return (next) => async (input) => {
      const component = await readComponent(input.entry, options);
      if (!component) return next(input);
      const { metadata, key, id, meta } = component;
      const description = meta?.getValue([
        "parameters",
        "docs",
        "description",
        "component",
      ]);
      return {
        ...(await next(input)),
        id,
        name: metadata?.name ?? key,
        path: input.entry.importPath,
        renderer: "jaspr",
        description:
          metadata?.description ??
          (typeof description === "string" ? description : undefined),
        apiDescription:
          metadata?.apiDescription ??
          "Dart builder registered as `" +
            key +
            "`. Story controls are fixture inputs; read the Dart source for the component constructor API.",
        jsDocTags: {},
      };
    };
  };
