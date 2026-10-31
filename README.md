# @codegrowers/storybook-jaspr-vite

A native Storybook renderer and Vite framework for Jaspr components written in
Dart. Mount real Jaspr components in Canvas and Docs, edit arguments with
Controls, record Actions and run TypeScript play functions against the DOM.

MIT licensed. Requires the companion
[`jaspr_storybook`](https://pub.dev/packages/jaspr_storybook) Dart runtime.
Both packages are released at `1.0.0`.

```sh
bun add --dev @codegrowers/storybook-jaspr-vite@^1.0.0 storybook@10.6.5 vite@8.3.5 @storybook/addon-docs@10.6.5
dart pub add --dev jaspr_storybook:^1.0.0
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

Tested with Jaspr 0.23.3 and 0.23.5, Storybook 10.6.5, Vite 8.3.5,
Bun 1.4.2 and Dart 3.13.5. The Dart SDK must be on `PATH`, or set
`framework.options.dartExecutable`. Node execution has not been verified.

Styles and assets belong to the consumer. Argument values must be compatible
with JSON. This version previews client-side Jaspr components; it does not
provide SSR/hydration testing, Wasm output, Dart constructor introspection or
automatic Dart story discovery.

To develop: run `bun install`, `bun run build`, `bun run format:check`,
`bun run lint`, `bun run typecheck` and `bun test`. Run `dart pub get` in
`example/`, then `bun run build:example` and `bun run preview` from the root.
