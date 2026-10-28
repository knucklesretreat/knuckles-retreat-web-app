import { defineConfig } from "astro/config";
import icon from "astro-icon";
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

export default defineConfig({
  site: "https://www.knucklesretreat.com",
  output: "static",
  // URLs keep the trailing slash Qwik City used (/faq/), matching canonicals and the sitemap.
  trailingSlash: "always",
  build: { format: "directory" },
  integrations: [icon(), partytownLib],
});
