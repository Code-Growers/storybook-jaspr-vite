import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { readCsf } from "storybook/internal/csf-tools";
import type { IndexEntry } from "storybook/internal/types";
import { readSourceRegions } from "./sources.js";
import type { FrameworkOptions } from "./types.js";

export interface ComponentMetadata {
  name: string;
  description?: string;
  apiDescription?: string;
  import?: string;
  sourceFiles?: string[];
  exampleCode?: string;
}

export interface MetadataOptions extends FrameworkOptions {
  configDir: string;
  workingDir: string;
}

export async function readMetadata(options: MetadataOptions) {
  if (!options.componentManifest)
    return {} as Record<string, ComponentMetadata>;
  const path = resolve(options.configDir, options.componentManifest);
  const data = JSON.parse(await readFile(path, "utf8"));
  if (
    data.schemaVersion !== 1 ||
    !data.components ||
    Array.isArray(data.components)
  )
    throw new Error(`Invalid Jaspr component manifest: ${path}`);
  const root = resolve(dirname(path), data.root ?? ".");
  for (const component of Object.values(
    data.components,
  ) as ComponentMetadata[]) {
    if (typeof component.name !== "string")
      throw new Error(`Missing component name in ${path}`);
    component.sourceFiles = component.sourceFiles?.map((file) =>
      resolve(root, file),
    );
  }
  return data.components as Record<string, ComponentMetadata>;
}

export async function readComponent(
  entry: IndexEntry,
  options: MetadataOptions,
) {
  const csf = (
    await readCsf(resolve(options.workingDir, entry.importPath), {
      makeTitle: () => entry.title,
    })
  ).parse();
  const meta = csf.objects({ stories: false })[0];
  const key = meta?.getValue(["component"]);
  if (typeof key !== "string") return undefined;
  const metadata = (await readMetadata(options))[key];
  return {
    csf,
    meta,
    key,
    metadata,
    id:
      csf.meta.id ??
      csf.stories[0]?.id.split("--")[0] ??
      entry.id.split("--")[0] ??
      key,
  };
}

export async function readExamples(options: MetadataOptions) {
  return readSourceRegions([
    resolve(options.configDir, options.entrypoint),
    ...(options.sourceFiles ?? []).map((path) =>
      resolve(options.configDir, path),
    ),
  ]);
}
