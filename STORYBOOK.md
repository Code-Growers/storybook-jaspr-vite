# Storybook for Jaspr

Two MIT-licensed packages provide the integration, both at version `1.0.0`:

| Registry | Package | Source |
| --- | --- | --- |
| pub.dev | [`jaspr_storybook`](https://pub.dev/packages/jaspr_storybook) | [Dart runtime](https://github.com/Code-Growers/jaspr_storybook) |
| npm | [`@codegrowers/storybook-jaspr-vite`](https://www.npmjs.com/package/@codegrowers/storybook-jaspr-vite) | [Storybook framework](https://github.com/Code-Growers/storybook-jaspr-vite) |

## Consumer setup

Add `jaspr_storybook` to your Dart application's development
dependencies and the matching npm framework plus Storybook/Vite to its JavaScript
development dependencies. For example, using Bun:

```sh
dart pub add --dev jaspr_storybook:^1.0.0
bun add --dev @codegrowers/storybook-jaspr-vite@^1.0.0 storybook@10.6.5 vite@8.3.5 @storybook/addon-docs@10.6.5
```

The current tested targets are Jaspr 0.23.3 and 0.23.5, Storybook 10.6.5, Vite
8.3.5, Bun 1.4.2 and Dart 3.13.5. The Jaspr constraint allows 0.23.x, but other patch versions
still need compatibility verification before extending the advertised matrix.
Node support has not been verified; the development and release scripts use Bun.

Register components in a Dart client entrypoint as shown in README.md. Configure
`.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@codegrowers/storybook-jaspr-vite';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);

export default {
  framework: {
    name: dirname(require.resolve('@codegrowers/storybook-jaspr-vite/package.json')),
    options: {
      entrypoint: '../lib/storybook.client.dart',
      // Optional directories outside the entrypoint directory:
      // watchPaths: ['../../shared_widgets/lib'],
      // dartExecutable: '/path/to/dart',
    },
  },
  stories: ['../stories/**/*.stories.ts'],
  addons: [dirname(require.resolve('@storybook/addon-docs/package.json'))],
} satisfies StorybookConfig;
```

Write normal CSF stories, using the Dart registry key as `component`:

```ts
import type { Meta, StoryObj } from '@codegrowers/storybook-jaspr-vite';

type Args = { label: string; disabled: boolean };
export default {
  title: 'Components/Button',
  component: 'button',
  tags: ['autodocs'],
  args: { label: 'Save', disabled: false },
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<Args>;

export const Default: StoryObj<Args> = {};
```

Run `dart pub get`, then `bun --bun storybook dev` or `bun --bun storybook build`.
The preset invokes the configured Dart SDK to compile the entrypoint. It serves
the result during development and emits it as a local asset in static builds.
No remote Dart or Jaspr server is required to view a built Storybook.

## Features and boundaries

- The renderer mounts actual Jaspr component trees directly into the Canvas.
  It does not depend on the HTML renderer or embed a second iframe.
- Controls and globals update the root while retaining descendant state. Dart
  can update controlled arguments through `story.updateArgs`.
- Actions cross the Dart/JavaScript boundary through a named event channel.
- Optional `undefined` object properties are omitted; array entries become
  `null`, following JSON conventions. Functions and opaque objects are rejected.
- Inline Docs can mount multiple independent previews. Use `story.instanceId`
  when assigning DOM ids.
- Story teardown disposes the Jaspr tree and removes the renderer-owned DOM.
  Builder errors reject rendering so Storybook can show its error UI.
- Play functions run after the Dart mount/update promise completes. They are
  authored in TypeScript against the preview's regular DOM.
- Changes to Dart files under the entrypoint directory or `watchPaths` trigger
  recompilation and a full preview reload. Dart state resets on source changes;
  this is not Jaspr hot reload. Compilation failures show the Vite error overlay.
- Styling remains in the application. Import CSS in `.storybook/preview.ts`
  and serve fonts/images with Storybook `staticDirs`. Jaspr-generated CSS or
  code generation must be prepared with the application's normal tooling.
- Dart constructor introspection, automatic Dart story discovery, server-only
  components, SSR/hydration verification and Wasm output are outside this version.
  Controls metadata is explicit. JSON-compatible arguments are required. To show
  Dart source in Docs, supply `parameters.docs.source.code` and `language: 'dart'`.

## Dart source in Docs

The renderer shows real Dart source regions in Docs and the optional Code panel,
with Dart syntax highlighting. In the Dart entrypoint or files listed in
`framework.options.sourceFiles`, surround a builder or component expression with
markers matching its registered component key:

```dart
// #docregion button
Component buttonStory(StorybookContext story) => button(
  disabled: story.arg<bool>('disabled'),
  onClick: () => story.action('onClick'),
  [.text(story.arg<String>('label'))],
);
// #enddocregion button
```

```ts
options: {
  entrypoint: '../lib/storybook.client.dart',
  sourceFiles: ['../lib/component_stories.dart'],
}
```

Paths are relative to the Storybook configuration directory. The entrypoint is
always scanned. Source files are watched automatically. Each region has one
unique name; nested, duplicate, empty or unclosed regions fail the build.
Only marked code is embedded in the static build. Snippets show the Dart builder
as written, including `story.arg` calls; changing controls does not rewrite Dart
source. The TypeScript `play` function continues to run independently.

For a hand-written example or a story-specific variant, use standard Storybook
`parameters.docs.source.code` with `language: 'dart'`. `docs.source.transform`
is also supported by the Docs source block. Without a matching region or an
explicit source override, the code panel indicates that Dart source is unconfigured.

## Examples and development

Each repository includes a small `example/` with a button, a controlled switch
and stateful counters. No backend or application-specific assets are needed.
The example configuration lives in `example/storybook/` so pub.dev includes it;
consumer applications can use the conventional `.storybook/` directory.

In the Dart runtime repository:

```sh
dart pub get
dart format .
dart analyze
dart test
cd example
dart pub get
bun install
bun run dev
```

In the npm framework repository:

```sh
bun install
bun run build
bun run format:check
bun run lint
bun run typecheck
bun test
cd example
dart pub get
cd ..
bun run build:example
bun run preview
```

The Dart example uses the local runtime and the published npm framework. The
npm example uses the local framework and the published Dart runtime. Changes
to the shared browser protocol must be verified across both repositories.

## Release

Keep the paired package versions compatible. Run the checks above, review
`dart pub publish --dry-run` in the Dart repository and `bun pm pack --dry-run`
in the npm repository, and verify the examples in a browser.

Publish the Dart runtime with `dart pub publish`, and the public scoped npm
framework with `bun publish --access public`. The npm publish lifecycle builds
the distribution and runs its checks. Registry credentials belong in the local
authentication environment and must never be committed. Tag releases in both
source repositories after successful publication.
