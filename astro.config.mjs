import { defineConfig } from "astro/config";
import { copyLibFiles } from "@qwik.dev/partytown/utils";
import { fileURLToPath } from "node:url";

// The Partytown snippet is rendered by src/components/Partytown.astro so it keeps its position in
// <head>; this only copies the library files it loads to /~partytown/ (debug build included, as before).
const partytownLib = {
  name: "partytown-lib",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      await copyLibFiles(fileURLToPath(new URL("~partytown", dir)));
    },
  },
};

// The browsers Qwik's build targeted (Vite 6's default "modules" target, minus "es2020", which Vite 8's
// bundler rejects next to browser versions; these browsers all support ES2020 anyway). Vite 8 defaults
// to "baseline-widely-available", which would ship native CSS nesting and drop
// -webkit-backdrop-filter, breaking older Safari/Chrome/Firefox that the Qwik site still supports.
const QWIK_BROWSER_TARGETS = ["edge88", "firefox78", "chrome87", "safari14"];

export default defineConfig({
  site: "https://www.knucklesretreat.com",
  output: "static",
  // URLs keep the trailing slash Qwik City used (/faq/), matching canonicals and the sitemap.
  trailingSlash: "always",
  // Qwik served all CSS from external stylesheets; Astro would otherwise inline small ones.
  build: { format: "directory", inlineStylesheets: "never" },
  integrations: [partytownLib],
  vite: {
    build: {
      target: QWIK_BROWSER_TARGETS,
      cssTarget: QWIK_BROWSER_TARGETS,
      cssMinify: "esbuild",
    },
  },
});
