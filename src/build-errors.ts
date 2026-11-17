type Listener = (error: Error) => void;
const listeners = new Set<Listener>();
let original: typeof console.error | undefined;
let intercepted: typeof console.error | undefined;

/** Jaspr 0.24's binding has no error callback and reports nested failures here. */
export function observeBuildErrors(listener: Listener): () => void {
  if (!original) {
    original = console.error;
    const forward = original;
    intercepted = (...args: unknown[]) => {
      forward.apply(console, args);
      if (
        typeof args[0] !== "string" ||
        !args[0].startsWith("Error while building ")
      )
        return;
      const error = new Error(args[0]);
      // The binding does not identify a story instance. Fail active previews
      // conservatively rather than silently accepting a fallback as a render.
      for (const report of [...listeners]) report(error);
    };
    console.error = intercepted;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && original) {
      if (console.error === intercepted) console.error = original;
      original = undefined;
      intercepted = undefined;
    }
  };
}
