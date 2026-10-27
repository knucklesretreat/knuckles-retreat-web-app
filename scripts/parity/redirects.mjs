// Records status codes and redirect targets for URL variants (trailing slash, case, apex/www,
// http/https). Read-only GET requests; redirects are not followed.
//
//   node redirects.mjs --base https://www.knucklesretreat.com --out baseline/live
//   node redirects.mjs --base http://localhost:4173 --out baseline/local --local
import { join } from "node:path";
import { ROUTES, args, save } from "./lib.mjs";

const opts = args({
  base: { type: "string" },
  out: { type: "string" },
  local: { type: "boolean", default: false },
});
if (!opts.base || !opts.out) {
  console.error("usage: node redirects.mjs --base <url> --out <dir> [--local]");
  process.exit(1);
}
const base = opts.base.replace(/\/$/, "");

const paths = [
  ...ROUTES.map((r) => r.path),
  ...ROUTES.filter((r) => r.path !== "/").map((r) => r.path.replace(/\/$/, "")),
  "/FAQ/",
  "/faq/?utm_source=test",
  "/faq?utm_source=test",
  "/index.html",
  "/robots.txt",
  "/site/sitemap.xml",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/service-worker.js",
];

const urls = paths.map((p) => base + p);
if (!opts.local) {
  const { hostname } = new URL(base);
  const apex = hostname.replace(/^www\./, "");
  urls.push(
    `http://${apex}/`,
    `https://${apex}/`,
    `http://www.${apex}/`,
    `https://${apex}/faq/`,
    `http://www.${apex}/faq`,
  );
}

const results = [];
for (const url of urls) {
  // Follow the chain manually so every hop is recorded.
  const hops = [];
  let current = url;
  for (let i = 0; i < 5; i++) {
    const res = await fetch(current, { redirect: "manual" });
    const location = res.headers.get("location");
    hops.push({ url: current, status: res.status, ...(location ? { location } : {}) });
    if (!location || res.status < 300 || res.status >= 400) break;
    current = new URL(location, current).href;
  }
  results.push({ url, hops });
  console.log(hops.map((h) => `${h.status} ${h.url}`).join("  →  "));
}

await save(join(opts.out, "redirects.json"), results);
