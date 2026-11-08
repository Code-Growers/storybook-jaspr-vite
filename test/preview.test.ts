import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { compilePreview, previewAssets } from "../src/vite-plugin.js";

test("deferred Dart libraries compile into parts that travel with the preview", async () => {
  const directory = await mkdtemp(join(tmpdir(), "jaspr-preview-test-"));
  try {
    await mkdir(join(directory, ".dart_tool"));
    await writeFile(
      join(directory, ".dart_tool", "package_config.json"),
      JSON.stringify({ configVersion: 2, packages: [] }),
    );
    await writeFile(
      join(directory, "later.dart"),
      "String message() => 'loaded';\n",
    );
    const entrypoint = join(directory, "main.dart");
    await writeFile(
      entrypoint,
      "import 'later.dart' deferred as later;\n\nFuture<void> main() async {\n  await later.loadLibrary();\n  print(later.message());\n}\n",
    );
    const preview = await compilePreview(entrypoint, "dart", true);
    expect([...preview.keys()]).toEqual(["preview.js", "preview.js_1.part.js"]);
    expect(preview.get("preview.js")?.toString()).toContain(
      '"preview.js_1.part.js"',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 120_000);

test("static builds emit the preview and its parts into one content-hashed directory", () => {
  const files = (part: string) =>
    new Map([
      ["preview.js", Buffer.from("main")],
      ["preview.js_1.part.js", Buffer.from(part)],
    ]);
  const first = previewAssets(files("part"), "assets");
  expect(first.entry).toMatch(
    /^assets\/jaspr-preview-[0-9a-f]{12}\/preview\.js$/,
  );
  expect(first.files.map((file) => file.fileName)).toEqual([
    first.entry,
    `${first.entry}_1.part.js`,
  ]);
  expect(previewAssets(files("part"), "assets").entry).toBe(first.entry);
  expect(
    posix.dirname(previewAssets(files("changed"), "assets").entry),
  ).not.toBe(posix.dirname(first.entry));
  expect(previewAssets(files("part"), "").entry).toBe(
    first.entry.slice("assets/".length),
  );
});
