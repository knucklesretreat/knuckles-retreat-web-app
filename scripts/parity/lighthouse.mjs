// Runs Lighthouse (mobile + desktop) for the key routes and saves category scores and core metrics.
// Run against the live site (or a deployed preview) — local preview servers don't compress or cache
// like production, so their performance numbers aren't comparable.
//
//   node lighthouse.mjs --base https://www.knucklesretreat.com --out baseline/live
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import * as chromeLauncher from "chrome-launcher";
import { join } from "node:path";
import { args, save } from "./lib.mjs";

const opts = args({
  base: { type: "string" },
  out: { type: "string" },
  runs: { type: "string", default: "3" },
});
if (!opts.base || !opts.out) {
  console.error(
    "usage: node lighthouse.mjs --base <url> --out <dir> [--runs 3]",
  );
  process.exit(1);
}
const base = opts.base.replace(/\/$/, "");
const runs = Number(opts.runs);
const paths = ["/", "/accommodation/", "/inquiry/"];
const metrics = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
];

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
const summary = {};
try {
  for (const path of paths) {
    for (const [formFactor, config] of [
      ["mobile", undefined],
      ["desktop", desktopConfig],
    ]) {
      const samples = [];
      for (let i = 0; i < runs; i++) {
        const { lhr } = await lighthouse(
          base + path,
          { port: chrome.port, output: "json", logLevel: "error" },
          config,
        );
        samples.push({
          scores: Object.fromEntries(
            Object.entries(lhr.categories).map(([k, c]) => [
              k,
              Math.round(c.score * 100),
            ]),
          ),
          metrics: Object.fromEntries(
            metrics.map((m) => [m, lhr.audits[m].numericValue]),
          ),
        });
      }
      // Median by performance score — Lighthouse varies run to run.
      samples.sort((a, b) => a.scores.performance - b.scores.performance);
      const median = samples[Math.floor(samples.length / 2)];
      (summary[path] ??= {})[formFactor] = {
        ...median,
        allPerformanceScores: samples.map((s) => s.scores.performance),
      };
      console.log(
        `${formFactor.padEnd(7)} ${path.padEnd(16)} ${JSON.stringify(median.scores)}`,
      );
    }
  }
} finally {
  chrome.kill();
}

await save(join(opts.out, "lighthouse.json"), {
  base,
  runAt: new Date().toISOString(),
  runsPerRoute: runs,
  results: summary,
});
