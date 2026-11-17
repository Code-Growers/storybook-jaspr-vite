# @codegrowers/storybook-jaspr-vite

A native Storybook renderer and Vite framework for Jaspr components written in
Dart. Mount real Jaspr components in Canvas and Docs, edit arguments with
Controls, record Actions and run TypeScript play functions against the DOM.

MIT licensed. Requires the companion
[`jaspr_storybook`](https://pub.dev/packages/jaspr_storybook) Dart runtime.
Beta `2.0.0-beta.0` supports Storybook `11.0.0-beta.3` and
`jaspr_storybook 1.1.0-beta.1` on Jaspr 0.24.

```sh
bun add --dev @codegrowers/storybook-jaspr-vite@2.0.0-beta.0 storybook@11.0.0-beta.3 vite@8.3.5 @storybook/addon-docs@11.0.0-beta.3
dart pub add --dev jaspr_storybook:1.1.0-beta.1
```

Register builders with `registerStorybook` in a Dart client entrypoint, configure
the framework in `.storybook/main.ts`, and write normal CSF stories with the
registered component key. The framework compiles Dart through Vite for both the
development server and static Storybook output.

```ts
import type { StorybookConfig } from '@codegrowers/storybook-jaspr-vite';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);

export default {
  framework: {
    name: dirname(require.resolve('@codegrowers/storybook-jaspr-vite/package.json')),
    options: { entrypoint: '../lib/storybook.client.dart' },
  },
  stories: ['../stories/**/*.stories.ts'],
} satisfies StorybookConfig;
```

Docs can show actual Dart builders selected with `#docregion` markers, with Dart
syntax highlighting. See [STORYBOOK.md](STORYBOOK.md) for Dart registration, CSF, controls, actions,
watch options, styling, examples and release instructions.

Tested with Jaspr 0.24.0-beta.1, Storybook 11.0.0-beta.3, Vite 8.3.5,
Bun 1.4.2 and Dart 3.13.5. The Dart SDK must be on `PATH`, or set
`framework.options.dartExecutable`. Node execution has not been verified.

Styles and assets belong to the consumer. Argument values must be compatible
with JSON. This version previews client-side Jaspr components; it does not
provide SSR/hydration testing, Wasm output or automatic Dart story discovery.
Optional generated metadata supplies resolved Dart constructor documentation.

To develop: run `bun install`, `bun run build`, `bun run format:check`,
`bun run lint`, `bun run typecheck` and `bun test`. Run `dart pub get` in
`example/`, then `bun run build:example` and `bun run preview` from the root.

## Headless agent workflow

Storybook 11 CLI documentation, Dart dependency tracing, Vitest component tests
and local review tools are supported by the native Jaspr providers. The package
includes `skills/jaspr-storybook-workflow`. See [STORYBOOK.md](STORYBOOK.md)
for metadata generation, browser setup, limitations and paired release checks.
