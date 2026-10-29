// Captures a reference snapshot of the site: server HTML, SEO <head>, DOM facts (images, links,
// headings), stylesheets, full-page screenshots, interaction/animation checkpoints and a scroll video.
//
//   node capture.mjs --base http://localhost:4173 --out baseline/local
//   node capture.mjs --base https://www.knucklesretreat.com --out baseline/live --no-screens
//   node capture.mjs --base <url> --out <dir> --css-only   # only (re)capture css/
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { rename } from "node:fs/promises";
import { join } from "node:path";
import { ROUTES, VIEWPORTS, args, save, wait } from "./lib.mjs";

const opts = args({
  base: { type: "string" },
  out: { type: "string" },
  "no-screens": { type: "boolean", default: false },
  "css-only": { type: "boolean", default: false },
});
if (!opts.base || !opts.out) {
  console.error(
    "usage: node capture.mjs --base <url> --out <dir> [--no-screens | --css-only]",
  );
  process.exit(1);
}
const base = opts.base.replace(/\/$/, "");
const out = opts.out;
const url = (path) => base + path;

const browser = await chromium.launch();
const consoleLog = {};

try {
  if (opts["css-only"]) {
    await captureCss();
  } else {
    await captureServerHtml();
    await captureCss();
    await captureDomFacts();
    if (!opts["no-screens"]) {
      await captureFullPages();
      await captureStates();
      await captureScrollVideo();
    }
    await save(join(out, "console.json"), consoleLog);
    await save(join(out, "meta.json"), {
      base,
      capturedAt: new Date().toISOString(),
      gitCommit: execSync("git rev-parse HEAD").toString().trim(),
      browser: `chromium ${browser.version()}`,
      screenshots: !opts["no-screens"],
    });
  }
  console.log(`done → ${out}`);
} finally {
  await browser.close();
}

// ---------------------------------------------------------------------------------------------

/**
 * Every stylesheet each route loads, in document order: linked files are saved once under their own
 * name, inline <style> blocks as <route>-inline-<n>.css; css/index.json maps routes to files.
 */
async function captureCss() {
  const index = {};
  const saved = new Set();
  for (const route of ROUTES) {
    const html = await (await fetch(url(route.path))).text();
    const files = [];
    for (const m of html.matchAll(
      /<link\b[^>]*rel="stylesheet"[^>]*>|<style\b[^>]*>([\s\S]*?)<\/style>/g,
    )) {
      if (m[0].startsWith("<style")) {
        if (!m[1].trim()) continue;
        const name = `${route.slug}-inline-${files.length}.css`;
        await save(join(out, "css", name), m[1]);
        files.push(name);
        continue;
      }
      const href = m[0].match(/href="([^"]+)"/)[1];
      const name = href.split("/").pop();
      if (!saved.has(name)) {
        await save(
          join(out, "css", name),
          await (await fetch(new URL(href, url(route.path)))).text(),
        );
        saved.add(name);
      }
      files.push(name);
    }
    index[route.slug] = files;
    console.log(
      `css   ${route.path} (${files.length} stylesheet${files.length === 1 ? "" : "s"})`,
    );
  }
  await save(join(out, "css", "index.json"), index);
}

/** Raw HTML exactly as the server sends it (what crawlers see), plus status and headers. */
async function captureServerHtml() {
  const responses = {};
  for (const route of ROUTES) {
    const res = await fetch(url(route.path), { redirect: "manual" });
    const html = await res.text();
    await save(join(out, "html", `${route.slug}.html`), html);
    responses[route.slug] = {
      path: route.path,
      status: res.status,
      headers: Object.fromEntries(
        ["content-type", "cache-control", "location", "x-robots-tag"]
          .filter((h) => res.headers.has(h))
          .map((h) => [h, res.headers.get(h)]),
      ),
    };
    console.log(`html  ${res.status} ${route.path}`);
  }
  await save(join(out, "responses.json"), responses);
}

/** <head> and DOM facts from the server-rendered page with JavaScript disabled. */
async function captureDomFacts() {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ROUTES) {
    await page.goto(url(route.path), { waitUntil: "domcontentloaded" });
    const facts = await page.evaluate(extractFacts);
    await save(join(out, "head", `${route.slug}.json`), facts.head);
    await save(join(out, "dom", `${route.slug}.json`), facts.dom);
    console.log(`dom   ${route.path}`);
  }
  await context.close();
}

// Runs in the browser. Framework attributes (q:*, on:*, data-qwik*) are dropped so the output can be
// compared across frameworks.
function extractFacts() {
  const ignored = (name) => /^(q:|on:|on-|data-qwik)/.test(name);
  const attrs = (el) =>
    Object.fromEntries(
      [...el.attributes]
        .filter((a) => !ignored(a.name))
        .map((a) => [a.name, a.value]),
    );

  const headEntry = (el) => {
    const entry = { tag: el.tagName.toLowerCase(), attrs: attrs(el) };
    if (entry.tag === "title") entry.text = el.textContent;
    if (entry.tag === "script" && el.type === "application/ld+json")
      entry.json = JSON.parse(el.textContent);
    else if (entry.tag === "script" && el.textContent.trim()) {
      const text = el.textContent;
      entry.inline = text.includes("partytown")
        ? "partytown-snippet"
        : `${text.length} chars: ${text.slice(0, 80)}`;
    }
    if (entry.tag === "style") entry.inline = `${el.textContent.length} chars`;
    return entry;
  };

  return {
    head: {
      htmlAttrs: { lang: document.documentElement.getAttribute("lang") },
      bodyAttrs: { lang: document.body.getAttribute("lang") },
      title: document.title,
      elements: [...document.head.children].map(headEntry),
    },
    dom: {
      headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
        (h) => ({
          tag: h.tagName.toLowerCase(),
          text: h.textContent.trim().replace(/\s+/g, " "),
        }),
      ),
      images: [...document.querySelectorAll("img, picture source, svg")].map(
        (el) => ({
          tag: el.tagName.toLowerCase(),
          ...attrs(el),
        }),
      ),
      backgrounds: [...document.querySelectorAll("[style]")]
        .filter((el) => el.getAttribute("style").includes("url("))
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          style: el.getAttribute("style"),
        })),
      inlineStyles: [...document.querySelectorAll("[style]")].map((el) => ({
        tag: el.tagName.toLowerCase(),
        style: el.getAttribute("style"),
      })),
      links: [...document.querySelectorAll("a")].map((a) => ({
        href: a.getAttribute("href"),
        text: a.textContent.trim().replace(/\s+/g, " "),
        ...(a.target ? { target: a.target } : {}),
        ...(a.getAttribute("aria-label")
          ? { ariaLabel: a.getAttribute("aria-label") }
          : {}),
      })),
      buttons: [...document.querySelectorAll("button")].map((b) => ({
        type: b.getAttribute("type"),
        text: b.textContent.trim().replace(/\s+/g, " "),
        ariaLabel: b.getAttribute("aria-label"),
      })),
      forms: [...document.querySelectorAll("input, select, textarea")].map(
        (el) => ({
          tag: el.tagName.toLowerCase(),
          ...attrs(el),
          ...(el.tagName === "SELECT" ? { options: el.options.length } : {}),
        }),
      ),
      iframes: [...document.querySelectorAll("iframe")].map(attrs),
      textLength: document.body.textContent.replace(/\s+/g, " ").trim().length,
    },
  };
}

// ---------------------------------------------------------------------------------------------

async function newPage(viewport, extra = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ...extra,
  });
  const page = await context.newPage();
  const key = `${viewport.width}`;
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      (consoleLog[key] ??= []).push({
        url: page.url(),
        type: msg.type(),
        text: msg.text(),
      });
    }
  });
  page.on("pageerror", (err) =>
    (consoleLog[key] ??= []).push({
      url: page.url(),
      type: "pageerror",
      text: err.message,
    }),
  );
  return { context, page };
}

async function load(page, path) {
  await page.goto(url(path), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
}

/** Scrolls like a user would, so IntersectionObserver/scroll-driven reveals fire. */
async function scrollThrough(page, { step = 0.6, pause = 300 } = {}) {
  const { height, vh } = await page.evaluate(() => ({
    height: document.body.scrollHeight,
    vh: innerHeight,
  }));
  for (let y = 0; y <= height; y += Math.round(vh * step)) {
    await page.evaluate((top) => scrollTo(0, top), y);
    await wait(pause);
  }
}

async function scrollToElement(page, selector) {
  const target = await page
    .locator(selector)
    .first()
    .evaluate((el) => el.getBoundingClientRect().top + scrollY - 80);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y < target; y += Math.round(vh * 0.5)) {
    await page.evaluate((top) => scrollTo(0, top), y);
    await wait(200);
  }
  await page.evaluate((top) => scrollTo(0, top), target);
}

// Third-party iframes (Google Maps, reCAPTCHA) render differently run to run; mask them.
function masks(page) {
  return [page.locator("iframe")];
}

/** Full-page screenshots for every route at every width, after all reveals have fired. */
async function captureFullPages() {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const { context, page } = await newPage(viewport);
      await load(page, route.path);
      await scrollThrough(page);
      await page.evaluate(() => scrollTo(0, 0));
      await wait(2000);
      await page.screenshot({
        path: join(out, "screens", String(viewport.width), `${route.slug}.png`),
        fullPage: true,
        animations: "disabled",
        mask: masks(page),
      });
      await context.close();
      console.log(`shot  ${viewport.width} ${route.path}`);
    }
  }
}

/** Viewport screenshots of specific animation / interaction states. */
async function captureStates() {
  const desktop = { width: 1280, height: 800 };
  const mobile = { width: 375, height: 812 };
  const shot = (page, name, extra = {}) =>
    page.screenshot({
      path: join(out, "states", `${name}.png`),
      mask: masks(page),
      ...extra,
    });

  const states = [
    {
      name: "home-hero-initial",
      viewport: desktop,
      run: async (page) => {
        await load(page, "/");
        await wait(2500);
      },
    },
    {
      name: "home-hero-slide-2-mid-transition",
      viewport: desktop,
      run: async (page) => {
        await load(page, "/");
        await wait(2500);
        await page.locator("#home > div").last().locator("img").nth(1).click();
        await wait(1200);
      },
    },
    {
      name: "home-hero-slide-2",
      viewport: desktop,
      run: async (page) => {
        await load(page, "/");
        await wait(2500);
        await page.locator("#home > div").last().locator("img").nth(1).click();
        await wait(3500);
      },
    },
    {
      name: "header-sticky",
      viewport: desktop,
      run: async (page) => {
        await load(page, "/");
        await page.evaluate(() => scrollTo(0, 300));
        await wait(1000);
      },
    },
    {
      name: "mobile-menu-open",
      viewport: mobile,
      run: async (page) => {
        await load(page, "/");
        await wait(1000);
        await page.locator("header > div:nth-child(2) > i").click();
        await wait(1000);
      },
    },
    ...[
      ["intro", "#intro"],
      ["accommodation-teaser", 'section:has-text("Your Private Sanctuary")'],
      ["gallery", "#gallery"],
      ["explore", "#explore"],
      ["testimonials", "#testimonials"],
      ["contact", "#contact"],
    ].flatMap(([name, selector]) =>
      [desktop, mobile].map((viewport) => ({
        name: `section-${name}-${viewport.width}`,
        viewport,
        run: async (page) => {
          await load(page, "/");
          await scrollToElement(page, selector);
          await wait(1800);
        },
      })),
    ),
    {
      name: "testimonial-next-mid-transition",
      viewport: desktop,
      run: async (page) => {
        await load(page, "/");
        await scrollToElement(page, "#testimonials");
        await wait(1800);
        await page.getByRole("button", { name: "Next testimonial" }).click();
        await wait(250);
      },
    },
    {
      name: "testimonial-next-done",
      viewport: desktop,
      run: async (page) => {
        await load(page, "/");
        await scrollToElement(page, "#testimonials");
        await wait(1800);
        await page.getByRole("button", { name: "Next testimonial" }).click();
        await wait(1200);
      },
    },
    {
      name: "accommodation-page-initial",
      viewport: desktop,
      run: async (page) => {
        await load(page, "/accommodation/");
        await wait(2000);
      },
    },
    ...[desktop, mobile].map((viewport) => ({
      name: `inquiry-validation-error-${viewport.width}`,
      viewport,
      run: async (page) => {
        // Submitting the empty form fails client-side validation; nothing is sent to the API.
        await load(page, "/inquiry/");
        await wait(1500);
        await page.locator("button[type=submit]").click();
        await wait(800);
        await page.locator("button[type=submit]").scrollIntoViewIfNeeded();
        await wait(300);
      },
    })),
  ];

  for (const state of states) {
    const { context, page } = await newPage(state.viewport);
    try {
      await state.run(page);
      await shot(page, state.name);
      console.log(`state ${state.name}`);
    } catch (err) {
      console.error(
        `state ${state.name} FAILED: ${err.message.split("\n")[0]}`,
      );
    } finally {
      await context.close();
    }
  }
}

/** A slow full scroll of the home page, as a manual reference for parallax feel. */
async function captureScrollVideo() {
  const viewport = { width: 1280, height: 800 };
  const dir = join(out, "video");
  const { context, page } = await newPage(viewport, {
    recordVideo: { dir, size: viewport },
  });
  await load(page, "/");
  await wait(2000);
  await scrollThrough(page, { step: 0.08, pause: 120 });
  await wait(1500);
  const video = page.video();
  await context.close();
  await rename(await video.path(), join(dir, "home-scroll-1280.webm"));
  console.log("video home-scroll-1280.webm");
}
