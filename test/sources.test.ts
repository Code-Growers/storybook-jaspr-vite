import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractSourceRegions, readSourceRegions } from "../src/sources.js";

test("Dart snippets preserve actual component code and exclude surrounding harness", () => {
  const source = `import 'private_harness.dart';\r\n// #docregion select\r\n  AppSelect(\r\n    labelText: story.arg<String>('label'),\r\n  );\r\n// #enddocregion select\r\nvoid privateHarness() {}\r\n// #docregion switch\r\nAppSwitch(checked: false);\r\n// #enddocregion switch`;
  expect(extractSourceRegions(source)).toEqual({
    select: "AppSelect(\n  labelText: story.arg<String>('label'),\n);",
    switch: "AppSwitch(checked: false);",
  });
});

test("invalid or ambiguous source regions fail instead of publishing incorrect snippets", () => {
  for (const source of [
    "// #docregion button\nAppButton();",
    "// #enddocregion button",
    "// #docregion button\nAppButton();\n// #enddocregion other",
    "// #docregion button\n// #enddocregion button",
    "// #docregion button\n// #docregion inner",
    "// #docregion button\nAppButton();\n// #enddocregion button\n// #docregion button",
  ])
    expect(() => extractSourceRegions(source, "example.dart")).toThrow(
      "example.dart",
    );
});

test("source file merging rejects component keys declared in multiple files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "jaspr-sources-test-"));
  try {
    const first = join(directory, "first.dart");
    const second = join(directory, "second.dart");
    const source =
      "// #docregion button\nAppButton();\n// #enddocregion button";
    await writeFile(first, source);
    await writeFile(second, source);
    expect(await readSourceRegions([first, first])).toEqual({
      button: "AppButton();",
    });
    await expect(readSourceRegions([first, second])).rejects.toThrow(
      "Duplicate Dart source region across files: button",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
