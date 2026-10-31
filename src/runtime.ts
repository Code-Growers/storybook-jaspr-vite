import { checkRuntime, type JasprRuntime } from "./protocol.js";

let loading: Promise<JasprRuntime> | undefined;

export function loadRuntime(url: string): Promise<JasprRuntime> {
  if (loading) return loading;
  loading = new Promise<JasprRuntime>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => {
      try {
        resolve(checkRuntime(window.__jasprStorybook));
      } catch (error) {
        script.remove();
        reject(error);
      }
    };
    script.onerror = () => {
      script.remove();
      reject(new Error(`Could not load the compiled Jaspr preview: ${url}`));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
