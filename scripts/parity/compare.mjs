// Compares a candidate capture against the baseline and prints a report. Exits 1 on any difference.
//
//   node compare.mjs --baseline baseline/local --candidate candidate/local
//     [--only head,responses,body,css,screens] [--routes faq,privacy-policy]
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { ROUTES as ALL_ROUTES, VIEWPORTS, args, save } from "./lib.mjs";

const opts = args({
  baseline: { type: "string" },
  candidate: { type: "string" },
  only: { type: "string" },
  routes: { type: "string" },
});
if (!opts.baseline || !opts.candidate) {
  console.error("usage: node compare.mjs --baseline <dir> --candidate <dir> [--only head,responses,body,css,screens] [--routes <slug,...>]");
  process.exit(1);
}
const ROUTES = opts.routes ? ALL_ROUTES.filter((r) => opts.routes.split(",").includes(r.slug)) : ALL_ROUTES;
const readJson = async (dir, ...path) => JSON.parse(await readFile(join(dir, ...path), "utf8"));
const readText = (dir, ...path) => readFile(join(dir, ...path), "utf8");

// Framework plumbing that is expected to differ: bundled CSS/JS, preloads, Qwik's service-worker
// registration and bundle-graph loader, and inlined component styles.
const FRAMEWORK_ASSET = /^\/(build|assets|_astro)\//;
function isFrameworkElement(el) {
  const ref = el.attrs.href ?? el.attrs.src ?? "";
  if (FRAMEWORK_ASSET.test(ref)) return true;
  if (el.tag === "style") return true;
  if (el.tag === "script" && el.attrs.type === "module" && !el.attrs.src) return true;
  return false;
}

function normalizeHeadElement(el) {
  const out = structuredClone(el);
  // Canonical host differs between localhost and production; compare the path.
  if (out.tag === "link" && out.attrs.rel === "canonical") out.attrs.href = new URL(out.attrs.href).pathname;
  return out;
}

// The capture stores only a marker for the Partytown snippet, so compare its exact text from the HTML.
function partytownSnippet(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((t) => t.includes("partytown"));
}

async function compareHead() {
  let failures = 0;
  for (const { slug } of ROUTES) {
    const [a, b] = await Promise.all([readJson(opts.baseline, "head", `${slug}.json`), readJson(opts.candidate, "head", `${slug}.json`)]);
    const problems = [];
    if (a.title !== b.title) problems.push(`title: ${JSON.stringify(a.title)} → ${JSON.stringify(b.title)}`);
    if (!isDeepStrictEqual(a.htmlAttrs, b.htmlAttrs)) problems.push(`<html> attrs: ${JSON.stringify(a.htmlAttrs)} → ${JSON.stringify(b.htmlAttrs)}`);
    if (!isDeepStrictEqual(a.bodyAttrs, b.bodyAttrs)) problems.push(`<body> attrs: ${JSON.stringify(a.bodyAttrs)} → ${JSON.stringify(b.bodyAttrs)}`);

    const ea = a.elements.filter((e) => !isFrameworkElement(e)).map(normalizeHeadElement);
    const eb = b.elements.filter((e) => !isFrameworkElement(e)).map(normalizeHeadElement);
    for (let i = 0; i < Math.max(ea.length, eb.length); i++) {
      if (!isDeepStrictEqual(ea[i], eb[i])) {
        problems.push(`element ${i}:\n      baseline:  ${JSON.stringify(ea[i])}\n      candidate: ${JSON.stringify(eb[i])}`);
      }
    }

    const [ha, hb] = await Promise.all([readText(opts.baseline, "html", `${slug}.html`), readText(opts.candidate, "html", `${slug}.html`)]);
    if (partytownSnippet(ha) !== partytownSnippet(hb)) problems.push("partytown snippet text differs");

    report(slug, problems);
    failures += problems.length;
  }
  return failures;
}

async function compareResponses() {
  const [a, b] = await Promise.all([readJson(opts.baseline, "responses.json"), readJson(opts.candidate, "responses.json")]);
  let failures = 0;
  for (const { slug } of ROUTES) {
    const problems = [];
    if (a[slug]?.status !== b[slug]?.status) problems.push(`status ${a[slug]?.status} → ${b[slug]?.status}`);
    const ta = a[slug]?.headers["content-type"], tb = b[slug]?.headers["content-type"];
    if (ta?.split(";")[0] !== tb?.split(";")[0]) problems.push(`content-type ${ta} → ${tb}`);
    report(slug, problems);
    failures += problems.length;
  }
  return failures;
}

// Server HTML <body> (what crawlers and JS-off visitors get), parsed by Chromium with JS disabled and
// serialized as one line per node. Normalized away: framework attributes and comments (Qwik's comment
// markers split text into several nodes, so adjacent text is merged), <script> and <style>, attribute
// order, whitespace runs, asset hashes (`/assets/<hash>-name.webp` from Qwik, `/_astro/name.<hash>.webp`
// from Astro → `asset:name.webp`) and date-input `min` dates (they're the capture date). Everything
// else must match.
async function serializeBody(page, html) {
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  return page.evaluate(() => {
    const comments = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
    const remove = [];
    while (comments.nextNode()) remove.push(comments.currentNode);
    remove.forEach((c) => c.remove());
    document.body.normalize();

    const DROP_ATTR = /^(q:|on:|on-document:|on-window:|preventdefault:|data-qwikest-icon$|data-astro-)/;
    const asset = (url) =>
      url
        .replace(/\/assets\/[A-Za-z0-9_-]{8}-([^/"'\s)]+?)\.(\w+)(?=["'\s),]|$)/g, "asset:$1.$2")
        .replace(/\/_astro\/([^/"'\s)]+?)\.[A-Za-z0-9_-]{8}(?:_[A-Za-z0-9]+)?\.(\w+)(?=["'\s),]|$)/g, "asset:$1.$2");
    const lines = [];
    const walk = (node, depth) => {
      const pad = "  ".repeat(depth);
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, " ");
        if (text) lines.push(`${pad}"${text}"`);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();
      if (tag === "script" || tag === "style") return;
      const attrs = [...node.attributes]
        .filter((a) => !DROP_ATTR.test(a.name))
        .map((a) => {
          const value = tag === "input" && node.type === "date" && a.name === "min" ? a.value.replace(/^\d{4}-\d{2}-\d{2}$/, "<date>") : asset(a.value);
          return `${a.name}="${value}"`;
        })
        .sort();
      lines.push(`${pad}<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>`);
      for (const child of node.childNodes) walk(child, depth + 1);
    };
    walk(document.body, 0);
    return lines;
  });
}

// Line diff (LCS) printed as hunks with 2 lines of context; capped so one bad page stays readable.
function diffLines(a, b, max = 60) {
  const n = a.length, m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const ops = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) ops.push([" ", a[i++]]), j++;
    else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) ops.push(["+", b[j++]]);
    else ops.push(["-", a[i++]]);
  }
  const keep = new Set();
  ops.forEach(([op], k) => { if (op !== " ") for (let c = k - 2; c <= k + 2; c++) keep.add(c); });
  const out = [];
  let last = -1, changes = 0;
  for (const k of [...keep].filter((k) => k >= 0 && k < ops.length).sort((x, y) => x - y)) {
    if (k > last + 1) out.push("      ...");
    const [op, line] = ops[k];
    if (op !== " ") changes++;
    out.push(`      ${op} ${line.length > 200 ? line.slice(0, 200) + "…" : line}`);
    last = k;
    if (out.length >= max) { out.push("      (diff truncated)"); break; }
  }
  return { changes: ops.filter(([op]) => op !== " ").length, text: out.join("\n") };
}

async function compareBody() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route("**/*", (route) => route.abort());
  const page = await context.newPage();
  let failures = 0;
  for (const { slug } of ROUTES) {
    const [ha, hb] = await Promise.all([readText(opts.baseline, "html", `${slug}.html`), readText(opts.candidate, "html", `${slug}.html`)]);
    const [a, b] = [await serializeBody(page, ha), await serializeBody(page, hb)];
    const { changes, text } = diffLines(a, b);
    report(slug, changes ? [`${changes} line(s) differ (- baseline, + candidate):\n${text}`] : []);
    failures += changes ? 1 : 0;
  }
  await browser.close();
  return failures;
}

// All CSS the site ships (union of every route's stylesheets), compared semantically: Chromium's CSSOM
// parses both sides and every declaration becomes "<at-rule context> <selector> { prop: value }", so
// minifier formatting, rule grouping and shorthand spelling drop out. Compared as multisets, which
// is enough here because the only cross-file overlap is global.css, loaded last on both sites.
// Chromium drops vendor-prefixed declarations it doesn't support (e.g. -webkit-backdrop-filter, which
// older Safari needs), so those and @import URLs are compared on the raw text. Ignored: Qwik City's
// router plumbing rule `:root{view-transition-name:none}` (no effect without view transitions).
const IGNORED_CSS = new Set([" :root { view-transition-name: none }"]);

async function flattenCss(page, css) {
  return page.evaluate((css) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css.replace(/@import\s+(url\([^)]*\)|"[^"]*")[^;]*;/g, ""));
    const out = [];
    const walk = (rules, ctx) => {
      for (const r of rules) {
        if (r instanceof CSSStyleRule) {
          const sel = r.selectorText.split(",").map((s) => s.trim()).sort().join(", ");
          for (const p of r.style) out.push(`${ctx} ${sel} { ${p}: ${r.style.getPropertyValue(p)}${r.style.getPropertyPriority(p) ? " !important" : ""} }`);
          if (r.cssRules.length) walk(r.cssRules, `${ctx} [in ${sel}]`);
        } else if (r instanceof CSSMediaRule) walk(r.cssRules, `${ctx}@media ${r.conditionText}`);
        else if (r instanceof CSSKeyframesRule) {
          for (const k of r.cssRules) for (const p of k.style) out.push(`${ctx}@keyframes ${r.name} ${k.keyText} { ${p}: ${k.style.getPropertyValue(p)} }`);
        } else out.push(`${ctx}${r.cssText}`);
      }
    };
    walk(sheet.cssRules, "");
    return out;
  }, css);
}

async function compareCss() {
  const load = async (dir) => {
    const index = await readJson(dir, "css", "index.json");
    const files = [...new Set(Object.values(index).flat())];
    return Promise.all(files.map((f) => readText(dir, "css", f)));
  };
  const [ca, cb] = [await load(opts.baseline), await load(opts.candidate)];
  const prefixed = (sheets) => sheets.flatMap((css) => css.match(/(?<![\w-])-(webkit|moz|ms|o)-[a-z-]+\s*:[^;}]+/g) ?? []).map((d) => d.replace(/\s+/g, " ").trim()).sort();
  const imports = (sheets) => sheets.flatMap((css) => [...css.matchAll(/@import\s+(?:url\()?["']?([^"')]+)/g)].map((m) => m[1])).sort();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const decls = async (sheets) => (await Promise.all(sheets.map((css) => flattenCss(page, css)))).flat().filter((d) => !IGNORED_CSS.has(d));
  const [da, db] = [await decls(ca), await decls(cb)];
  await browser.close();

  const count = (list) => list.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
  const [na, nb] = [count(da), count(db)];
  const missing = [...na].filter(([k, n]) => (nb.get(k) ?? 0) < n).map(([k]) => k);
  const extra = [...nb].filter(([k, n]) => (na.get(k) ?? 0) < n).map(([k]) => k);
  const problems = [];
  if (!isDeepStrictEqual(imports(ca), imports(cb))) problems.push(`@import: ${JSON.stringify(imports(ca))} → ${JSON.stringify(imports(cb))}`);
  if (!isDeepStrictEqual(prefixed(ca), prefixed(cb))) problems.push(`vendor-prefixed declarations:\n      baseline:  ${JSON.stringify(prefixed(ca))}\n      candidate: ${JSON.stringify(prefixed(cb))}`);
  const show = (list, sign) => list.slice(0, 25).map((d) => `${sign} ${d.length > 200 ? d.slice(0, 200) + "…" : d}`).join("\n      ") + (list.length > 25 ? `\n      … ${list.length - 25} more` : "");
  if (missing.length) problems.push(`${missing.length} declaration(s) only in baseline:\n      ${show(missing, "-")}`);
  if (extra.length) problems.push(`${extra.length} declaration(s) only in candidate:\n      ${show(extra, "+")}`);
  report(`all stylesheets (${da.length} vs ${db.length} declarations)`, problems);
  return problems.length;
}

// Full-page screenshots (captured after every scroll reveal has fired) at each viewport. A page fails
// if its size differs or more than 0.1 % of pixels differ (pixelmatch threshold 0.1 absorbs
// anti-aliasing). Diff images go to <candidate>/screens-diff/ for review by eye.
const MAX_DIFF_RATIO = 0.001;

async function compareScreens() {
  const { PNG } = await import("pngjs");
  const { default: pixelmatch } = await import("pixelmatch");
  let failures = 0;
  for (const { width } of VIEWPORTS) {
    for (const { slug } of ROUTES) {
      const name = `${width}/${slug}`;
      const [pa, pb] = [opts.baseline, opts.candidate].map((dir) => join(dir, "screens", String(width), `${slug}.png`));
      if (!existsSync(pa) || !existsSync(pb)) {
        report(name, [`missing screenshot (${existsSync(pa) ? "candidate" : "baseline"}); capture without --no-screens`]);
        failures++;
        continue;
      }
      const [a, b] = await Promise.all([pa, pb].map(async (p) => PNG.sync.read(await readFile(p))));
      if (a.width !== b.width || a.height !== b.height) {
        report(name, [`size ${a.width}x${a.height} → ${b.width}x${b.height}`]);
        failures++;
        continue;
      }
      const diff = new PNG({ width: a.width, height: a.height });
      const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
      const ratio = changed / (a.width * a.height);
      if (ratio > MAX_DIFF_RATIO) {
        const out = join(opts.candidate, "screens-diff", String(width), `${slug}.png`);
        await save(out, PNG.sync.write(diff));
        report(name, [`${(ratio * 100).toFixed(3)} % of pixels differ (${changed}) → ${out}`]);
        failures++;
      } else {
        report(`${name}${changed ? ` (${(ratio * 100).toFixed(4)} % differ)` : ""}`, []);
      }
    }
  }
  return failures;
}

function report(slug, problems) {
  if (!problems.length) console.log(`  ok    ${slug}`);
  else console.log(`  DIFF  ${slug}\n${problems.map((p) => `    - ${p}`).join("\n")}`);
}

// ---------------------------------------------------------------------------------------------

const checks = { head: compareHead, responses: compareResponses, body: compareBody, css: compareCss, screens: compareScreens };
const selected = opts.only ? opts.only.split(",") : Object.keys(checks);

let failures = 0;
for (const name of selected) {
  console.log(`\n## ${name}`);
  failures += await checks[name]();
}
console.log(failures ? `\n${failures} difference(s)` : "\nno differences");
process.exit(failures ? 1 : 0);
