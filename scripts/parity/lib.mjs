import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

export const ROUTES = [
  { slug: "home", path: "/" },
  { slug: "accommodation", path: "/accommodation/" },
  { slug: "inquiry", path: "/inquiry/" },
  { slug: "faq", path: "/faq/" },
  { slug: "privacy-policy", path: "/privacy-policy/" },
  { slug: "terms-and-conditions", path: "/terms-and-conditions/" },
  { slug: "404", path: "/this-page-does-not-exist/" },
];

export const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
];

export function args(options) {
  return parseArgs({ options, strict: true }).values;
}

export async function save(path, data) {
  await mkdir(dirname(path), { recursive: true });
  const body = typeof data === "string" || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2) + "\n";
  await writeFile(path, body);
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
