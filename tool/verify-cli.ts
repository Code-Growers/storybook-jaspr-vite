import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scratch = await mkdtemp(join(tmpdir(), "jaspr-cli-"));
let next = 0;
async function run(args: string[], expectedExit = 0) {
  const output = join(scratch, `${++next}.json`);
  const result = Bun.spawn(
    [
      "bun",
      "run",
      "--bun",
      "storybook",
      "tools",
      "--config-dir",
      "example/storybook",
      "--no-attach",
      ...args,
      "--json",
      "--output",
      output,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const timeout = setTimeout(() => result.kill(), 120_000);
  const [code, stdout, stderr] = await Promise.all([
    result.exited,
    new Response(result.stdout).text(),
    new Response(result.stderr).text(),
  ]);
  clearTimeout(timeout);
  if (code !== expectedExit)
    throw new Error(`CLI failed: ${args.join(" ")}\n${stdout}\n${stderr}`);
  return JSON.parse(await readFile(output, "utf8"));
}
function requireResult(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const failureFile = "example/stories/RegressionFailure.stories.ts";
try {
  const docs = await run(["docs", "show", "--id", "examples-button"]);
  requireResult(
    docs.entry.component.stories[0].snippet.includes("story.arg"),
    "Headless docs lost the Dart source",
  );
  const variant = await run([
    "docs",
    "show-story",
    "--storyId",
    "examples-button--default",
  ]);
  requireResult(
    JSON.stringify(variant).includes("story.arg"),
    "Story-specific CLI docs lost the Dart source",
  );
  const affected = await run([
    "stories",
    "find-by-component",
    "--componentPaths",
    JSON.stringify(["example/lib/deferred_greeting.dart"]),
  ]);
  requireResult(
    affected.results[0].matches.some(
      (match: { storyId: string }) =>
        match.storyId === "examples-deferred--default",
    ),
    "Dart dependency change is not mapped to stories",
  );
  const passing = (await run(["test", "run"])).result;
  requireResult(
    passing.totalTestCount >= 6 &&
      passing.componentTestCount.success >= 6 &&
      passing.componentTestCount.error === 0 &&
      passing.a11yCount.error === 0 &&
      passing.unhandledErrors.length === 0,
    "Example component or accessibility tests failed or ran zero tests",
  );
  await writeFile(
    failureFile,
    'export default { title: "Regression/Failure", component: "nested-error" };\nexport const Default = {};\n',
  );
  const failing = (
    await run(
      [
        "test",
        "run",
        "--stories",
        JSON.stringify([{ storyId: "regression-failure--default" }]),
        "--a11y",
        "false",
      ],
      1,
    )
  ).result;
  requireResult(
    failing.totalTestCount === 1 && failing.componentTestCount.error === 1,
    "Nested Dart failure was silently accepted",
  );
  console.log(
    `CLI verified: Dart docs, transitive change detection, ${passing.totalTestCount} passing stories, and a nested failure rejected.`,
  );
} finally {
  await rm(failureFile, { force: true });
  await rm(scratch, { recursive: true, force: true });
}
