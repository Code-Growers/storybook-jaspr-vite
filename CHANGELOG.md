# Changelog

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
