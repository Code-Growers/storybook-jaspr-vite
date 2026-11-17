import { expect, test } from "bun:test";
import { createDocgenProvider } from "../src/docgen.js";
import { storyDocsProvider } from "../src/story-docs.js";
import { importParsers } from "../src/import-parsers.js";
import { resolve } from "node:path";

const options = {
  configDir: resolve("example/storybook"),
  workingDir: process.cwd(),
  entrypoint: "../lib/storybook.client.dart",
};
const entry = {
  type: "story" as const,
  subtype: "story" as const,
  id: "examples-button--default",
  name: "Default",
  title: "Examples/Button",
  importPath: "./example/stories/Button.stories.ts",
};
test("headless providers preserve story IDs and real Dart snippets", async () => {
  const provider = await createDocgenProvider(options);
  const metadata = await provider(async () => undefined)({ entry });
  expect(metadata?.id).toBe("examples-button");
  expect(metadata?.renderer).toBe("jaspr");
  const docs = await storyDocsProvider(
    async () => undefined,
    options,
  )({ entry });
  expect(Object.keys(docs?.stories ?? {})).toEqual([
    "examples-button--default",
    "examples-button--disabled",
  ]);
  expect(docs?.stories[entry.id]?.snippet).toContain(
    "story.arg<bool>('disabled')",
  );
  expect(docs?.stories[entry.id]?.warning).toContain("fixture");
});

test("Dart import parser follows conditional, exported and deferred files", async () => {
  const parser = importParsers(options).find((parser) =>
    parser.extensions.includes(".dart"),
  );
  if (!parser) throw new Error("Missing Dart parser");
  const edges = await parser.parse(
    {
      filePath: resolve("example/lib/storybook.client.dart"),
      source: `import 'dart:async';\nimport 'base.dart' if (dart.library.js_interop) 'web.dart';\nexport 'parts.dart';\nimport 'lazy.dart' deferred as lazy;\n// import 'ignored.dart';\n/* import 'ignored2.dart'; */`,
    },
    { parseScriptWithOxc: async () => [] },
  );
  expect(edges.map((edge) => edge.specifier)).toEqual(
    ["base.dart", "web.dart", "parts.dart", "lazy.dart"].map((file) =>
      resolve("example/lib", file),
    ),
  );
});
