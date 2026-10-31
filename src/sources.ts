import { readFile } from "node:fs/promises";

/** Extract explicitly selected Dart code without trying to parse Dart as JavaScript. */
export function extractSourceRegions(
  source: string,
  filename = "Dart source",
): Record<string, string> {
  const regions: Record<string, string> = Object.create(null);
  let current: { name: string; lines: string[] } | undefined;
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const marker = /^\s*\/\/\s*#(end)?docregion\s+([^\s,]+)\s*$/.exec(line);
    if (!marker) {
      current?.lines.push(line);
      continue;
    }
    const name = marker[2] ?? "";
    const fail = (message: string): never => {
      throw new Error(`${filename}:${index + 1}: ${message}`);
    };
    if (!marker[1]) {
      if (current) fail("Dart source regions must not be nested.");
      if (Object.hasOwn(regions, name))
        fail(`Duplicate Dart source region: ${name}`);
      current = { name, lines: [] };
    } else {
      if (!current || current.name !== name)
        return fail(`Unmatched #enddocregion ${name}`);
      const lines = current.lines;
      const indentation = Math.min(
        ...lines
          .filter((value) => value.trim())
          .map((value) => /^\s*/.exec(value)?.[0].length ?? 0),
      );
      const code = lines
        .map((value) => value.slice(indentation))
        .join("\n")
        .trim();
      if (!code) fail(`Empty Dart source region: ${name}`);
      regions[name] = code;
      current = undefined;
    }
  }
  if (current)
    throw new Error(`${filename}: Unclosed #docregion ${current.name}`);
  return regions;
}

export async function readSourceRegions(
  files: string[],
): Promise<Record<string, string>> {
  const sources: Record<string, string> = Object.create(null);
  for (const file of new Set(files)) {
    for (const [name, code] of Object.entries(
      extractSourceRegions(await readFile(file, "utf8"), file),
    )) {
      if (Object.hasOwn(sources, name))
        throw new Error(
          `${file}: Duplicate Dart source region across files: ${name}`,
        );
      sources[name] = code;
    }
  }
  return sources;
}
