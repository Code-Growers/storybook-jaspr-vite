import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import type { Plugin, ViteDevServer } from "vite";
import type { FrameworkOptions } from "./types.js";
import { readSourceRegions } from "./sources.js";

const exec = promisify(execFile);
const virtualId = "virtual:jaspr-storybook-runtime";
const resolvedId = `\0${virtualId}`;
const devUrl = "/@jaspr-storybook/preview.js";

async function packageConfig(entrypoint: string): Promise<string> {
  let directory = dirname(entrypoint);
  while (true) {
    const candidate = join(directory, ".dart_tool", "package_config.json");
    try {
      await access(candidate);
      return candidate;
    } catch {
      const parent = dirname(directory);
      if (directory === parent)
        throw new Error("Run dart pub get before starting Jaspr Storybook.");
      directory = parent;
    }
  }
}

export async function compilePreview(
  entrypoint: string,
  dartExecutable: string,
  production: boolean,
): Promise<Buffer> {
  const packages = await packageConfig(entrypoint);
  const scratch = await mkdtemp(join(tmpdir(), "jaspr-storybook-"));
  try {
    const output = join(scratch, "preview.js");
    await exec(
      dartExecutable,
      [
        "compile",
        "js",
        "--no-source-maps",
        `--packages=${packages}`,
        production ? "-O2" : "-O1",
        "-o",
        output,
        entrypoint,
      ],
      { cwd: dirname(entrypoint), maxBuffer: 8 * 1024 * 1024 },
    );
    return await readFile(output);
  } catch (error) {
    const output = error as {
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    throw new Error(
      `Jaspr Storybook could not compile ${entrypoint}.\n${output.stdout ?? ""}${output.stderr ?? ""}${output.message ?? ""}`,
      { cause: error },
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

export function dartPreviewPlugin(
  options: FrameworkOptions,
  configDir: string,
): Plugin {
  const entrypoint = resolve(configDir, options.entrypoint);
  const sourceFiles = [
    entrypoint,
    ...(options.sourceFiles ?? []).map((path) => resolve(configDir, path)),
  ];
  const watchPaths = [
    dirname(entrypoint),
    ...sourceFiles.map(dirname),
    ...(options.watchPaths ?? []).map((path) => resolve(configDir, path)),
  ];
  let production = false;
  let bundle: Buffer;
  let sources: Record<string, string> = {};
  let queued = Promise.resolve();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let server: ViteDevServer | undefined;
  const recompile = () => {
    queued = queued.then(async () => {
      try {
        const next = await compilePreview(
          entrypoint,
          options.dartExecutable ?? "dart",
          production,
        );
        const nextSources = await readSourceRegions(sourceFiles);
        bundle = next;
        sources = nextSources;
        const module = server?.moduleGraph.getModuleById(resolvedId);
        if (module) server?.moduleGraph.invalidateModule(module);
        server?.ws.send({ type: "full-reload" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        server?.config.logger.error(message);
        server?.ws.send({ type: "error", err: { message, stack: "" } });
      }
    });
  };
  return {
    name: "jaspr-storybook",
    configResolved(config) {
      production = config.command === "build";
    },
    async buildStart() {
      sources = await readSourceRegions(sourceFiles);
      bundle = await compilePreview(
        entrypoint,
        options.dartExecutable ?? "dart",
        production,
      );
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      const sourceExport = `export const dartSources = ${JSON.stringify(sources)};`;
      if (!production)
        return `${sourceExport} export const bundleUrl = ${JSON.stringify(devUrl)};`;
      const reference = this.emitFile({
        type: "asset",
        name: "jaspr-preview.js",
        source: bundle,
      });
      return `${sourceExport} export const bundleUrl = import.meta.ROLLUP_FILE_URL_${reference};`;
    },
    configureServer(devServer) {
      server = devServer;
      server.middlewares.use(devUrl, (_request, response) => {
        response.setHeader(
          "Content-Type",
          "application/javascript; charset=utf-8",
        );
        response.setHeader("Cache-Control", "no-store");
        response.end(bundle);
      });
      server.watcher.add(watchPaths);
      const onChange = (path: string) => {
        const absolute = resolve(path);
        if (
          !absolute.endsWith(".dart") ||
          !watchPaths.some((directory) => {
            const pathFromDirectory = relative(directory, absolute);
            return (
              pathFromDirectory !== ".." &&
              !pathFromDirectory.startsWith(`..${sep}`) &&
              !isAbsolute(pathFromDirectory)
            );
          })
        )
          return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(recompile, 150);
      };
      server.watcher
        .on("add", onChange)
        .on("change", onChange)
        .on("unlink", onChange);
      server.httpServer?.once("close", () => {
        if (timer) clearTimeout(timer);
        server?.watcher
          .off("add", onChange)
          .off("change", onChange)
          .off("unlink", onChange);
      });
    },
  };
}
