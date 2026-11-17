# Storybook 11 for Jaspr

The beta pair is `jaspr_storybook 1.1.0-beta.1` and
`@codegrowers/storybook-jaspr-vite 2.0.0-beta.0`, tested with Storybook
`11.0.0-beta.3`, Jaspr `0.24.0-beta.1`, Vite `8.3.5`, Bun `1.4.2`,
TypeScript `6.0.3`, and Vitest `4.1.12`. Keep all Storybook packages on the same
exact beta. The stable npm 1.x line supports Storybook 10; Dart 1.0.x supports
Jaspr 0.23. Node execution has not been verified.

## Install

```sh
dart pub add --dev jaspr_storybook:1.1.0-beta.1
bun add --dev @codegrowers/storybook-jaspr-vite@2.0.0-beta.0 storybook@11.0.0-beta.3 @storybook/addon-docs@11.0.0-beta.3 vite@8.3.5
```

Register client-side Dart builders with `registerStorybook`, and use their keys
as `component` in TypeScript CSF 3 stories. Import `Meta`, `StoryObj` and
`StorybookConfig` from the npm framework. The framework config requires
`options.entrypoint`, relative to the Storybook config directory. Optional
`sourceFiles` selects additional Dart snippet files, and `watchPaths` includes
external Dart sources. Consumer CSS and fonts stay in the consumer project.

Wrap Dart examples in `// #docregion <builder-key>` and matching
`// #enddocregion <builder-key>` markers. The renderer exposes these examples in
Docs, the Code panel and the headless CLI. Story-specific
`parameters.docs.source.code` takes precedence. Snippets show the fixture as
written; they are not reconstructed from control values.

## Headless documentation and change detection

```sh
bun run --bun storybook tools --no-attach docs list --withStoryIds true --json
bun run --bun storybook tools --no-attach docs show --id <component-id>
bun run --bun storybook tools --no-attach stories find-by-component --componentPaths '["lib/controls.dart"]' --json
```

Run from the Storybook project directory. For another config location, put
`--config-dir <directory>` after `tools`, before `docs` or `stories`.
The framework contributes Storybook 11 docgen, story-docs and import-parser
providers. They do not compile or execute Dart to read documentation. The import
parser maps CSF registration keys to Dart files and follows imports, exports,
parts, conditional and deferred imports. Shared fixtures intentionally produce
conservative affected sets. CSS, tokens and dynamically loaded assets may require
explicit consumer selection.

For constructor documentation, create a metadata configuration:

```json
{
  "schemaVersion": 1,
  "root": "..",
  "components": {
    "button": {
      "name": "AppButton",
      "library": "lib/controls.dart",
      "symbols": ["AppButton"],
      "import": "import 'package:my_app/controls.dart';",
      "description": "Primary action control",
      "contract": "Use the shared button for application actions.",
      "example": {"file": "lib/stories.dart", "region": "button"}
    }
  }
}
```

Paths are relative to `root`, which is relative to the config file. Symbols must
be exported from the specified library. Optional `example.supportRegions` includes
supporting definitions before the main region. Generate with:

```sh
dart run jaspr_storybook:metadata --config .storybook/metadata.config.json --output .storybook/components.json
# CI freshness check:
dart run jaspr_storybook:metadata --config .storybook/metadata.config.json --output .storybook/components.json --check
```

Set `framework.options.componentManifest: './components.json'`. The extractor
uses resolved Dart types, constructor defaults and documentation. It is a VM-only
library (`package:jaspr_storybook/metadata.dart`); the browser runtime never imports
analyzer. Story args remain explicit fixture controls, separate from constructor
parameters. Regenerate after source changes. Manifest schema v1 belongs to this
package; the translation to Storybook's experimental provider APIs is isolated
inside the npm framework and tested against the pinned beta.

## Tests and review

Add the matching `@storybook/addon-vitest`, `@storybook/addon-a11y`, Vitest 4 and
`@vitest/browser-playwright`. Configure a nested `test.projects` entry with
`storybookTest({configDir: <absolute-directory>})` and browser mode. See the npm
repository's `vitest.config.ts`; it uses an installed Chrome channel and does not
download browsers. The example is verified using both Vitest and the native CLI.

```sh
bun run --bun storybook tools --no-attach test run --json
bun run --bun storybook tools --port 6006 review create --help
```

Inspect nonzero `totalTestCount`, component/a11y failure counts and unhandled
errors. Failed story tests return a nonzero exit status. Preview URLs and review
creation require a running Storybook dev server. Review creation replaces the
active local review; use IDs returned by discovery tools.

Controlled Dart `updateArgs` updates work in portable tests as well as the
manager. Mount/update promises settle before play functions. Nested Jaspr 0.24
build failures are reported through its console-error path; the renderer observes
that specific message and fails active previews conservatively, preserving the
original console output and restoring its observer on teardown. Concurrent
previews cannot attribute such errors to one instance because Jaspr exposes no
instance-specific callback.

This is a client renderer. Source edits recompile Dart and reload the preview;
there is no stateful hot reload, server-only rendering, or SSR/hydration testing.
Component tests do not replace application authentication or backend tests.

## Agent skills

Both package archives contain `skills/jaspr-storybook-workflow/SKILL.md`.
In Dart consumers install the version from the resolved package:

```sh
dart run skills@ get --package jaspr_storybook --agent codex --all
```

npm consumers can copy that skill directory from the installed package into their
agent's project skill directory. The Dart repository owns the skill; synchronize
its identical copy into the npm package for paired releases. Project-specific
component selection, design tokens, localization and verification rules take
precedence over generic examples. The integration uses Storybook's native CLI;
no additional Storybook MCP server is required.

## Release verification

Run Dart format, analysis, tests and `dart pub publish --dry-run`. In the npm
repository run format:check, lint, typecheck, test, test:integration and
build:example, inspect `bun pm pack --dry-run`, and verify the example in a browser.
The integration script checks headless source, transitive Dart dependencies,
nonempty passing component/a11y tests and a deliberately failing nested build.
Publish the Dart prerelease first, then `bun publish --access public --tag beta`.
Never move npm latest to this beta. Test clean registry installations and tag
both source repositories after successful publication.
