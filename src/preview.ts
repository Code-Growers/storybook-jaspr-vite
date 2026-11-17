import { action } from "storybook/actions";
import { UPDATE_STORY_ARGS } from "storybook/internal/core-events";
import {
  enhanceArgTypes,
  SNIPPET_RENDERED,
} from "storybook/internal/docs-tools";
import type { ArgsStoryFn, RenderContext } from "storybook/internal/types";
import { addons } from "storybook/preview-api";
import { bundleUrl, dartSources } from "virtual:jaspr-storybook-runtime";
import "./dart-highlighting.js";
import { checkRecord, type JasprRuntime } from "./protocol.js";
import { loadRuntime } from "./runtime.js";
import type { JasprRenderer } from "./types.js";
import { observeBuildErrors } from "./build-errors.js";

export const parameters = {
  renderer: "jaspr",
  docs: {
    story: { inline: true },
    source: { language: "dart", type: "dynamic" },
  },
};
export const argTypesEnhancers = [enhanceArgTypes];

export const render: ArgsStoryFn<JasprRenderer> = (args, context) => ({
  component: context.component ?? "",
  args,
});

interface Session {
  component: string;
  runtime: JasprRuntime;
  host: HTMLElement;
  disposed: boolean;
  ready: Promise<unknown>;
  failure?: Error;
  args: Record<string, unknown>;
  globals: Record<string, unknown>;
  dispose(): void;
}

const sessions = new WeakMap<HTMLElement, Session>();
let nextInstance = 0;

export async function renderToCanvas(
  context: RenderContext<JasprRenderer>,
  canvas: HTMLElement,
): Promise<() => void> {
  const story = context.storyFn();
  if (
    !story ||
    typeof story.component !== "string" ||
    !story.component.trim()
  ) {
    throw new Error(
      "Set component to a registered Jaspr builder key in your story metadata.",
    );
  }
  const args = checkRecord(story.args, "args");
  const globals = checkRecord(context.storyContext.globals, "globals");
  const runtime = await loadRuntime(bundleUrl);
  const emitSource = () => {
    addons.getChannel().emit(SNIPPET_RENDERED, {
      id: context.storyContext.id,
      args: context.storyContext.unmappedArgs ?? context.storyContext.args,
      source:
        dartSources[story.component] ??
        "// No Dart source region is configured for this component.",
      format: false,
    });
  };
  const previous = sessions.get(canvas);
  if (
    previous &&
    !previous.disposed &&
    previous.component === story.component &&
    !context.forceRemount
  ) {
    previous.args = args;
    previous.globals = globals;
    previous.ready = previous.ready
      .catch(() => {})
      .then(() => {
        if (!previous.disposed)
          return runtime.update(previous.host.id, args, globals);
      });
    await previous.ready;
    if (previous.failure) throw previous.failure;
    if (!previous.disposed) emitSource();
    context.showMain();
    return previous.dispose;
  }
  previous?.dispose();
  canvas.replaceChildren();
  const host = document.createElement("div");
  host.id = `jaspr-storybook-${++nextInstance}`;
  canvas.appendChild(host);
  let rendering = true;
  let stopObserving = () => {};
  const session: Session = {
    component: story.component,
    runtime,
    host,
    disposed: false,
    ready: Promise.resolve(),
    args,
    globals,
    dispose() {
      if (session.disposed) return;
      session.disposed = true;
      stopObserving();
      try {
        runtime.unmount(host.id);
      } finally {
        // Jaspr disposal releases component state. The renderer owns DOM removal.
        host.replaceChildren();
        host.remove();
        if (sessions.get(canvas) === session) sessions.delete(canvas);
      }
    },
  };
  sessions.set(canvas, session);
  stopObserving = observeBuildErrors((error) => {
    session.failure = error;
    if (!rendering) context.showException(error);
  });
  session.ready = runtime.mount(
    host.id,
    story.component,
    host.id,
    args,
    globals,
    (type, payload) => {
      if (session.disposed) return;
      if (type === "error") {
        const failure = checkRecord(payload, "error");
        const error = new Error(String(failure.message));
        if (typeof failure.stack === "string") error.stack = failure.stack;
        session.failure = error;
        context.showException(error);
        return;
      }
      if (type === "action") {
        const event = checkRecord(payload, "action");
        if (typeof event.name !== "string")
          throw new Error("A Jaspr action must have a name.");
        action(event.name)(event.value);
      } else if (type === "args") {
        const patch = checkRecord(payload, "updatedArgs");
        session.args = { ...session.args, ...patch };
        // Portable stories have no manager listening to UPDATE_STORY_ARGS.
        // Apply controlled input locally as well as publishing it to Controls.
        const updatedArgs = session.args;
        session.ready = session.ready.then(async () => {
          if (!session.disposed)
            await runtime.update(host.id, updatedArgs, session.globals);
          if (session.failure) throw session.failure;
        });
        void session.ready.catch((error: unknown) =>
          context.showException(error as Error),
        );
        addons.getChannel().emit(UPDATE_STORY_ARGS, {
          storyId: context.storyContext.id,
          updatedArgs: patch,
        });
      }
    },
  );
  try {
    await session.ready;
    if (session.failure) throw session.failure;
    rendering = false;
    if (!session.disposed) {
      emitSource();
      context.showMain();
    }
  } catch (error) {
    session.dispose();
    if (sessions.get(canvas) && sessions.get(canvas) !== session)
      return () => {};
    throw error;
  }
  return session.dispose;
}
