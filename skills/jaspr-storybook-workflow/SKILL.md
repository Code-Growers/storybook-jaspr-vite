---
name: jaspr-storybook-workflow
description: Discover, document, test and review Dart/Jaspr components with the Storybook 11 CLI and the Code Growers Jaspr renderer. Use for Jaspr stories and component-library work; application SSR and authentication still require application tests.
---

# Jaspr Storybook workflow

Read the project's AGENTS.md and Storybook configuration. Use the locally pinned
Storybook and package manager; these examples use Bun from the Storybook project
directory. Put CLI connection options before the toolset. For a nonstandard
configuration directory add `--config-dir <directory>` after `tools`.

## Discover before implementing

Use the project's component catalogue first when present: it owns composition,
layout, accessibility and localization rules. Then inspect native Storybook docs:

```sh
bun run --bun storybook tools --no-attach docs list --withStoryIds true --json
bun run --bun storybook tools --no-attach docs show --id <returned-component-id>
bun run --bun storybook tools --no-attach docs show-story --storyId <returned-story-id>
```

These commands read Dart examples without running the preview. Component IDs,
Dart registration keys and story IDs are distinct; always use returned IDs.
The optional `componentManifest` supplies resolved Dart constructor documentation.
Without it, source examples and explicit story documentation remain available,
but controls are not a complete Dart API reference. Do not infer constructors
from story args or invent unavailable metadata.

## Author paired examples

Register a real Dart builder with `registerStorybook` and use its exact key as
CSF 3 `component`. Import Meta/StoryObj from @codegrowers/storybook-jaspr-vite.
Keep existing meta IDs and export names stable. Supply explicit args/argTypes;
arguments and globals must be JSON-compatible, never closures or components.
Use StorybookContext.action/updateArgs for fixture events and controlled state.
Namespace DOM IDs with instanceId for concurrent Docs previews.

Keep Dart source inside #docregion/#enddocregion markers matching the builder key.
Include supporting definitions in generated metadata where required. Explicit
parameters.docs.source.code overrides the region for a story-specific example.
Examples show fixture source, not code rewritten for each control value. Replace
fixture context with real state and localization when composing application UI.

After public API changes, regenerate the project's metadata and catalogue and
run their freshness checks. `dart run jaspr_storybook:metadata --help` describes
the generic extractor. Do not import its analyzer library into browser code.

## Verify affected behavior

```sh
bun run --bun storybook tools --no-attach stories changed --json
bun run --bun storybook tools --no-attach stories find-by-component --componentPaths '["path/to/component.dart"]' --json
bun run --bun storybook tools --no-attach test run --stories '[{"storyId":"returned-story-id"}]' --json
```

Dart imports, exports, parts, conditional branches and deferred imports are traced.
Shared fixture files can conservatively select multiple stories. Check every file
you changed is represented; CSS/tokens and dynamic relationships may need explicit
consumer selection. Never interpret an empty affected set as proof of no impact.

CLI tests need @storybook/addon-vitest, a Vitest browser project with storybookTest,
and an available browser. Run browser suites sequentially to avoid competing
compiler/browser processes hitting the beta runner startup timeout. Use a nested test.projects configuration and an absolute
configDir. The package example demonstrates the setup. Do not install browser
binaries when repository rules prohibit it. Report unavailable execution.

Require nonzero totalTestCount and inspect componentTestCount, a11yCount and
unhandledErrors. A completed command with zero tests is not verification. Failures
can accompany a nonzero CLI exit code. Keep unit, analyzer and application tests.
Nested Jaspr build errors fail active previews conservatively because the Jaspr
binding does not expose an instance-specific error callback.

## Review

Reuse or start the project's Storybook server, then use `tools --port <port>
stories preview` or `review create`. Read each tool's --help for the current beta's
input schema. Use returned story IDs, include changed states and affected consumer
examples, and pass accurate changedFiles. Creating a review replaces the active
local review. Return the actual review URL after checking the page.

Source edits trigger Dart recompilation and a full preview reload. This renderer
does not implement Jaspr stateful hot reload or SSR/hydration verification.
