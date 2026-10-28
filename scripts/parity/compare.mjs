// Compares a candidate capture against the baseline and prints a report. Exits 1 on any difference.
//
//   node compare.mjs --baseline baseline/local --candidate candidate/local [--only head,responses]
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { ROUTES, args } from "./lib.mjs";

const opts = args({
  baseline: { type: "string" },
  candidate: { type: "string" },
  only: { type: "string" },
});
if (!opts.baseline || !opts.candidate) {
  console.error("usage: node compare.mjs --baseline <dir> --candidate <dir> [--only head,responses]");
  process.exit(1);
}
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

function report(slug, problems) {
  if (!problems.length) console.log(`  ok    ${slug}`);
  else console.log(`  DIFF  ${slug}\n${problems.map((p) => `    - ${p}`).join("\n")}`);
}

// ---------------------------------------------------------------------------------------------

const checks = { head: compareHead, responses: compareResponses };
const selected = opts.only ? opts.only.split(",") : Object.keys(checks);

let failures = 0;
for (const name of selected) {
  console.log(`\n## ${name}`);
  failures += await checks[name]();
}
console.log(failures ? `\n${failures} difference(s)` : "\nno differences");
process.exit(failures ? 1 : 0);
