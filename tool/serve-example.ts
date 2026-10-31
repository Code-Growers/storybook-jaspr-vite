import { resolve, sep } from "node:path";

const root = resolve(import.meta.dir, "../storybook-static");
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT ?? 6006),
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const path = resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!path.startsWith(`${root}${sep}`))
      return new Response("Not found", { status: 404 });
    const file = Bun.file(path);
    if (!(await file.exists()))
      return new Response("Not found", { status: 404 });
    const extension = path.slice(path.lastIndexOf("."));
    return new Response(file, {
      headers: { "Content-Type": types[extension] ?? file.type },
    });
  },
});
console.log(`Jaspr Storybook example: ${server.url}`);
