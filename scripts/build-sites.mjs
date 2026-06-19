import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const clientDir = resolve(dist, "client");
const serverDir = resolve(dist, "server");
const openAiDir = resolve(dist, ".openai");

await rm(dist, { recursive: true, force: true });

await build({
  root,
  build: {
    outDir: clientDir,
    emptyOutDir: true,
  },
});

await mkdir(serverDir, { recursive: true });
await writeFile(
  resolve(serverDir, "index.js"),
  `const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) {
      return response;
    }

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    const hasExtension = /\\.[^/]+$/.test(url.pathname);

    if (request.method === "GET" && acceptsHtml && !hasExtension) {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }

    return response;
  },
};

export default worker;
`,
);

await mkdir(openAiDir, { recursive: true });
await cp(resolve(root, ".openai", "hosting.json"), resolve(openAiDir, "hosting.json"));
