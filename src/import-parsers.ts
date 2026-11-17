import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCsf } from "storybook/internal/csf-tools";
import type { ImportEdge } from "storybook/internal/oxc-parser";
import type { StorybookConfigRaw } from "storybook/internal/types";
import { readMetadata, type MetadataOptions } from "./metadata.js";

type Parsers = Exclude<
  NonNullable<StorybookConfigRaw["experimental_importParsers"]>,
  (...args: never[]) => unknown
>;
const edge = (specifier: string): ImportEdge => ({
  specifier,
  kind: "static",
  importedNames: null,
});

async function resolveDartImport(
  specifier: string,
  file: string,
): Promise<string | undefined> {
  if (specifier.startsWith("dart:")) return undefined;
  if (!specifier.startsWith("package:"))
    return resolve(dirname(file), specifier);
  const [name, ...segments] = specifier.slice(8).split("/");
  let directory = dirname(file);
  while (true) {
    const config = resolve(directory, ".dart_tool/package_config.json");
    try {
      const data = JSON.parse(await readFile(config, "utf8"));
      const pkg = data.packages.find(
        (pkg: { name: string }) => pkg.name === name,
      );
      if (!pkg)
        throw new Error(`Dart package ${name} is missing from ${config}`);
      const root = new URL(pkg.rootUri, pathToFileURL(config));
      return fileURLToPath(
        new URL(segments.join("/"), new URL(pkg.packageUri ?? "lib/", root)),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = dirname(directory);
      if (parent === directory)
        throw new Error(`Run dart pub get before tracing ${file}`);
      directory = parent;
    }
  }
}

export function importParsers(options: MetadataOptions): Parsers {
  return [
    {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"],
      async parse({ filePath, source }, context) {
        const edges = await context.parseScriptWithOxc(source, filePath);
        if (!/\.stories\.[cm]?[jt]sx?$/.test(filePath)) return edges;
        const csf = loadCsf(source, {
          fileName: filePath,
          makeTitle: (title) => title,
        }).parse();
        const key = csf.objects({ stories: false })[0]?.getValue(["component"]);
        if (typeof key !== "string") return edges;
        const metadata = (await readMetadata(options))[key];
        const sources = metadata?.sourceFiles ?? [
          resolve(options.configDir, options.entrypoint),
          ...(options.sourceFiles ?? []).map((file) =>
            resolve(options.configDir, file),
          ),
        ];
        return [
          ...edges,
          ...sources.map(edge),
          ...(options.componentManifest
            ? [edge(resolve(options.configDir, options.componentManifest))]
            : []),
        ];
      },
    },
    {
      extensions: [".dart"],
      async parse({ filePath, source }) {
        // Include every conditional branch and deferred import conservatively.
        const directives = source
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .matchAll(/^\s*(?:import|export|part)\s+(['"])[\s\S]*?;/gm);
        const imports = new Set<string>();
        for (const directive of directives) {
          for (const literal of directive[0].matchAll(/(['"])([^'"\n]+)\1/g)) {
            const resolved = await resolveDartImport(
              literal[2] ?? "",
              filePath,
            );
            if (resolved) imports.add(resolved);
          }
        }
        return [...imports].map(edge);
      },
    },
  ];
}
