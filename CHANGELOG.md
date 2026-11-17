# Changelog

## 2.0.0-beta.0

- Require Storybook 11.0.0-beta.3; retain CSF 3 authoring and the v1 Dart bridge.
- Provide headless Dart component and story docs through Storybook provider hooks.
- Trace Dart imports, exports, parts, conditional and deferred dependencies for native affected-story tools.
- Support controlled argument updates in portable Vitest stories and surface nested Jaspr build failures.
- Fix managerHead configuration typing, package a Jaspr workflow skill, and verify native CLI component/a11y tests including a deliberate failing render.

## 1.0.1

- Keep the parts dart2js emits for deferred imports. Development serves them
  next to the preview, and static builds emit them with the preview into one
  content-hashed directory, so `loadLibrary()` works in Storybook.

## 1.0.0

- Initial MIT-licensed release of the Jaspr Storybook integration.
- Render Jaspr components with controls, globals, actions and argument updates.
- Preserve component state on argument updates and isolate concurrent Docs previews.
- Dispose component trees on teardown and surface render errors in Storybook.
- Compile Dart through Vite for development and static Storybook builds.
- Display actual Dart source regions in Docs with Dart syntax highlighting.
