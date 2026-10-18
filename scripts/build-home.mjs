// Monta a página inicial (tenentegustavo.com.br) já pronta, sem Babel no navegador.
//
//   npm run build:home
//
// 1. Gera app.js: app.jsx + React de produção, comprimido (o navegador só "acorda" a página).
// 2. Gera o HTML do app.jsx e grava no index.html, entre <!--SSR--> e <!--/SSR-->,
//    para quem chega (Google, WhatsApp, celular lento) já ver o conteúdo sem esperar programa.
// 3. Atualiza o ?v= do app.js no index.html para o navegador não usar versão velha.
//
// Rode depois de qualquer mudança no app.jsx e commite app.js + index.html junto.
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const at = (f) => path.join(ROOT, f);

// 1) app.js do navegador
await build({
  entryPoints: [at("home-entry.jsx")],
  outfile: at("app.js"),
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019"],
  jsx: "transform",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  logLevel: "warning",
});

// 2) HTML pronto: compila o app.jsx para Node só para gerar o HTML
const tmp = at("scripts/.home-ssr.mjs");
await build({
  entryPoints: [at("app.jsx")],
  outfile: tmp,
  bundle: true,
  platform: "node",
  format: "esm",
  jsx: "transform",
  packages: "external",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});
const { default: App } = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
const { default: React } = await import("react");
const { renderToString } = await import("react-dom/server");
const markup = renderToString(React.createElement(App));
rmSync(tmp);

// 3) grava no index.html
const js = readFileSync(at("app.js"));
const versao = createHash("sha1").update(js).digest("hex").slice(0, 10);
const indexPath = at("index.html");
const html = readFileSync(indexPath, "utf8");
if (!/<!--SSR-->[\s\S]*<!--\/SSR-->/.test(html) || !/src="app\.js\?v=[^"]*"/.test(html)) {
  throw new Error("index.html sem as marcas <!--SSR--> / <!--/SSR--> ou sem o <script src=\"app.js?v=...\">");
}
const novo = html
  .replace(/<!--SSR-->[\s\S]*<!--\/SSR-->/, () => `<!--SSR-->${markup}<!--/SSR-->`)
  .replace(/src="app\.js\?v=[^"]*"/, `src="app.js?v=${versao}"`);
writeFileSync(indexPath, novo);

console.log(`app.js: ${(js.length / 1024).toFixed(1)} KB · HTML pronto: ${(markup.length / 1024).toFixed(1)} KB · v=${versao}`);
