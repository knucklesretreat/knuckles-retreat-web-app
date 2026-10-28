# Qwik → Astro Migration Plan

Branch: `astro-migration`
Status: Draft
Goal: Replace Qwik / Qwik City (SSR on Vercel Edge) with Astro (static output on Vercel) **with zero
visible or SEO regressions**. Every page must look, animate and index exactly as it does today.

## Roadmap

Each step ships and is verified on its own, so a regression can always be traced to a single change.

| Step | What | Section |
| --- | --- | --- |
| 1 | Astro migration on Vercel (pixel/SEO parity) | Phases 0–5 (§3–§6) |
| 2 | Replace reCAPTCHA with Cloudflare Turnstile **and** verify the token in the Firebase function | Phase 6 (§7) |
| 3 | Move hosting from Vercel to Cloudflare (Workers static assets) | Phase 7 (§8) |
| 4 | Post-migration improvements (images, fonts, etc.) | Phase 8 (§9) |

---

## 0. Ground rules

1. **Parity first, improvements second.** Phase 1–4 reproduce today's output exactly — including known
   quirks. Fixes and optimizations happen only in Phase 6, each as a separate, individually verified
   change.
2. **The baseline is the spec.** Before touching any code we capture the current site's HTML, `<head>`,
   screenshots and Lighthouse scores (Phase 0). The migration is "done" only when the new build matches
   that baseline.
3. **CSS is moved, not edited.** All 17 CSS files (≈6.4k lines) are copied byte-for-byte. Any CSS change
   during parity phases is a bug.
4. **Initial HTML must equal Qwik's SSR output** (minus Qwik's `q:*` / `on:*` attributes and script tags).
   Client scripts only change things *after* load, exactly as `useVisibleTask$` does today.
5. **Ship via Vercel preview deployments only** until sign-off. Production switch is a single promote;
   rollback is Vercel "Instant Rollback" to the last Qwik deployment.

---

## 1. Current-state inventory (what must be preserved)

### Routes (URLs must not change)

| URL | Source | Notes |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Home, Intro, Accommodation, Gallery, Explore, Testimonial, Contact, FloatingButton |
| `/accommodation/` | `src/routes/accommodation/index.tsx` | Room grid from `rooms.json`, staggered card animation |
| `/inquiry/` | `src/routes/inquiry/index.tsx` | Reservation form → Firebase, reCAPTCHA v2 |
| `/faq/` | `src/routes/faq/index.tsx` | Static |
| `/privacy-policy/` | `src/routes/privacy-policy/index.tsx` | Static |
| `/terms-and-conditions/` | `src/routes/terms-and-conditions/index.tsx` | Static |

- **Trailing slashes:** Qwik City defaults to `trailingSlash: true` (canonical URLs and the sitemap
  both use `/faq/` style). Non-slash URLs currently **301** to the slashed version, query string kept
  (`/faq?x=1` → `/faq/?x=1`). Paths are case-sensitive (`/FAQ/` → 404); `/index.html` → 404.
- **Domain redirects (Vercel domain config, captured 2026-10-28):** `knucklesretreat.com` → 308 →
  `https://www.knucklesretreat.com/`; `http://` → 308 → `https://`. `www` is the canonical host.
- **Canonical:** `RouterHead` emits `<link rel="canonical" href={loc.url.href}>` → absolute URL with
  trailing slash.

### `<head>` contents (order matters for diffing)

From `src/root.tsx` + `src/components/router-head/router-head.tsx`:

1. `<meta charset="utf-8">`
2. Partytown inline snippet (`forward: ['dataLayer.push']`)
3. JSON-LD `<script type="application/ld+json">` (`src/components/schema/schema.tsx`)
4. `<script src="https://www.google.com/recaptcha/api.js" async defer>` (every page)
5. `<link rel="manifest" href="/manifest.json">`
6. `<title>` (per route)
7. `<link rel="canonical">`
8. `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
9. `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`
10. Per-route meta: `description`, `theme-color`, `og:title`, `og:description`, `og:image`,
    `og:type`, `og:site_name`, `og:url`
11. Qwik service-worker registration

Document attributes: `<html lang="en-us">` (from `entry.ssr.tsx` container attributes),
`<body lang="en">`.

### Static files in `public/` (copied as-is)

`favicon.svg`, `fonts/poppins-*.woff2`, icon PNGs, `manifest.json`, `manifest.webmanifest`,
`robots.txt`, `site/sitemap.xml` (robots.txt points at `/site/sitemap.xml` — keep that path).

### Image pipeline (must be reproduced exactly in parity phase)

| Import style | What Qwik produces today | Used in |
| --- | --- | --- |
| `img.webp?jsx` | `<img>` with `srcset` at **200/400/600/800/1200w**, WebP q75, `width`/`height` of the largest variant (see `qwik-city/lib/vite` `imagePlugin`) | Home slides 2–4, thumbs, patterns, branches, accommodation hero |
| `img.webp?url` | **Re-encoded, not the original:** `?url` counts as a directive, so vite-imagetools re-saves the file with sharp's defaults (same format and dimensions, quality 80, metadata stripped; `.jpg` is emitted as `.jpeg`). Hashed URL | Gallery, Explore, Home slide 1 `<picture>`, accommodation section bg, contact bg, room cards, header pattern, line pattern |
| `Logo-Symbol.svg?jsx` | Inline `<svg>` component | Header, Footer, Contact |
| `quote.svg?url` | Inlined as a `data:image/svg+xml` URI (under Vite's 4 KB inline limit) | Testimonial card background |

### Client behaviour (all `useVisibleTask$` — default strategy is `intersection-observer`, i.e. it runs when the component first becomes visible)

| Component | Behaviour to reproduce |
| --- | --- |
| Header | `sticky` + `logo_only` classes when `scrollY > 0` (rAF-throttled); mobile menu open/close toggles `active` on `.navigation`; logo click → `/` |
| Home (hero) | 4-slide fade slider, auto-advance every 15 s, 800 ms fade-out delay, 1500 ms transition lock; thumbnails switch slides; zoom-in/out classes per slide; parallax: slide images `translateY(scrollY*0.1)`, text `translateY(scrollY*-0.1)`; "Inquire Now" → `/inquiry` |
| Intro | Adds `animate` class when section top ≤ 70 % viewport height (scroll-checked) |
| Accommodation (home section) | IntersectionObserver (0.3) → `animate`; bg image swaps to `img1-sm` at ≤ 876 px on resize; bg parallax `backgroundPositionY = (scrollY − introBottom + 60) * 0.3`; "Explore" → `/accommodation` |
| Gallery | IO (0.2) reveals text + grid (`visible`); while section visible, parallax translate clamped to ±3 % vh, factor −0.08, `transition: transform .2s ease-out`; resets to 0 when out of view |
| Explore | Same as Gallery. Note `scrollY` signal is never updated, so the pattern image's `translateY(0px)` is static — keep it static |
| Testimonial | IO (0.15) reveals title/carousel; same clamped parallax; carousel prev/next with 500 ms slide-out/slide-in (two cards rendered during a transition); `slideInInitial` on first mount, removed 700 ms after visible; carousel height = tallest card (min 290 px), recomputed on resize; avatar `onError` → placeholder; star rating full/half/empty |
| Contact | IO (0.3) → `animate`; bg parallax relative to `#testimonials` bottom (fallback `#explore`) |
| Accommodation page | On visible: hero `animateHero`, room cards `animateRoomCard` staggered 150 ms, booking section `animateBooking` |
| Inquiry form | See §4.4 |

### Other

- `PUBLIC_API_URL` env var (inlined at build time — same in Astro via `import.meta.env.PUBLIC_*`).
- `vercel.json`: immutable cache headers for `/build/*` (Qwik's asset dir).
- Qwik's prefetch **service worker** at `/service-worker.js` is installed in returning visitors' browsers.
- Icons from `@qwikest/icons` (Ionicons + Material Outlined), rendered as inline `<svg>`.

---

## 2. Target architecture

```
astro.config.mjs        site, trailingSlash: 'always', build.format: 'directory', output: 'static'
src/
  layouts/
    BaseLayout.astro    <html>, <head> (replaces root.tsx + RouterHead + Schema), Header, Footer
  components/
    Header.astro            + inline <script>
    Footer.astro
    FloatingButton.astro
    Schema.astro
    home/Hero.astro         + <script>
    home/Intro.astro        + <script>
    home/AccommodationTeaser.astro + <script>
    home/Gallery.astro      + <script>
    home/Explore.astro      + <script>
    home/Testimonials.astro + <script>
    home/Contact.astro      + <script>
    inquiry/InquiryForm.astro + <script>
  lib/
    parallax.ts         shared clamped-parallax + reveal helpers (Gallery/Explore/Testimonial)
    seo.ts              shared OG/meta defaults
  pages/
    index.astro
    accommodation.astro  → /accommodation/
    inquiry.astro
    faq.astro
    privacy-policy.astro
    terms-and-conditions.astro
    404.astro
  data/                 unchanged JSON files
  media/                unchanged
  styles/global.css     moved from src/global.css (fix relative spinner.svg path only)
  **/*.module.css       copied byte-for-byte next to their component
public/                 unchanged + service-worker.js kill-switch (see §4.7)
```

**No UI framework islands.** All interactivity is plain TypeScript in Astro `<script>` tags (bundled,
deduplicated, `type="module"`). This matches today's behaviour, which is already imperative DOM code
wrapped in `useVisibleTask$`.

**Package changes**

- Added (exact versions): `astro@7.3.8`, `@astrojs/check@0.9.12` (Phase 1); `esbuild@0.28.2` (Phase 2,
  the CSS minifier, see §4.3). Astro 7 needs **Node ≥ 22.23.4** — set the
  Vercel project's Node version and `engines.node` accordingly when the build switches (Phase 3).
- Kept: `@qwik.dev/partytown@0.11.2` — it is a standalone package, and using the same version keeps the
  inline snippet byte-identical. `@astrojs/partytown` is **not** used (it injects the snippet at the end
  of `<head>`, which changes the order).
- Verification tooling lives in `scripts/parity/` with its own `package.json` (Playwright, Lighthouse).
- Removed in Phase 1: `vercel` (CLI; its pinned esbuild 0.14 broke Astro's Vite 8 tree — `npm run deploy`
  now uses `npx vercel deploy`).
- Removed in Phase 2: `astro-icon`, `@iconify-json/ion`, `@iconify-json/ic` (icons are generated from
  qwikest instead, see §4.3).
- Removed with Qwik (end of Phase 3, done): `@builder.io/qwik`, `@builder.io/qwik-city`, `@qwikest/icons`,
  `eslint-plugin-qwik`, `vite-tsconfig-paths`, `vite`, `undici`, plus the temporary `astro:*` scripts and
  `tsconfig.astro.json` (its settings become `tsconfig.json`; drop the `src/lib` exclude).
- Deleted: `adapters/`, `src/entry.*.tsx`, `src/root.tsx`, `src/routes/`, `vite.config.ts`,
  `.vscode/qwik*.code-snippets`, and the Qwik-only `src/components/{starter,floating-button,partytown,
  router-head,schema}/` and `src/types/`. `sharp` left the top level with Qwik; Astro always used its
  own nested `sharp@0.35.5`, so image output is unchanged. ESLint stays for `src/**/*.ts` without the
  Qwik plugin (`.astro` files are covered by `astro check`). Scripts are now `dev`, `build`, `preview`
  (:4173), `check`, `lint`, `fmt`, `deploy`.

---

## 3. Phase 0 — Capture the baseline (before any migration code)

Run on `main`, against a local production build **and** the live site.

1. `npm run build && npm run preview` (Qwik production build).
2. Add `scripts/parity/` (on the migration branch) with a Playwright script that, for each route:
   - saves the full rendered HTML and an extracted, normalized `<head>` (title, all meta, canonical,
     icon, manifest, JSON-LD) to `baseline/<route>.head.json`;
   - saves the initial server HTML (JS disabled) to `baseline/<route>.html`;
   - takes full-page screenshots at **375, 768, 1280, 1920 px** widths, after waiting for fonts/images
     and freezing time (`page.clock`) so slider/animation state is deterministic;
   - takes viewport screenshots at scroll checkpoints for each animated section (reveal states,
     header sticky state, mobile menu open);
   - records a short video of a full scroll on `/` (manual reference for parallax feel).
3. Record Lighthouse (mobile + desktop) for `/`, `/accommodation/`, `/inquiry/`.
4. Record redirect behaviour: `curl -I` for `/faq`, `/faq/`, `/FAQ/`, `/nonexistent`, and the
   apex/`www` and `http`/`https` variants (`http://knucklesretreat.com`, `https://knucklesretreat.com`,
   `http://www.knucklesretreat.com`). These must stay the same through the later host move (Phase 7).
5. Note exactly what `?jsx` images render (attributes like `loading`, `decoding`, `srcset`, `sizes`)
   from the baseline HTML — the Astro image output must match these.

Deliverable: `scripts/parity/baseline/` committed on the branch (screenshots/video kept local, see
`scripts/parity/README.md`).

**Phase 0 results (captured 2026-10-28, commit `817c272`):**

- Live `<head>` matches the local production build on all 7 routes → local screenshots are a valid baseline.
- Live Lighthouse (median of 3), mobile / desktop performance: `/` 79 / 95, `/accommodation/` 75 / 98,
  `/inquiry/` 82 / 98. Accessibility 100 (inquiry 96), SEO 100, Best Practices 81 everywhere.
  Mobile LCP 4.7–6.8 s. Mobile runs vary a lot (e.g. 67–98), so compare medians, not single runs.
- Existing console errors to expect in both builds: `window.grecaptcha.render is not a function` on
  `/inquiry/` (race with the async reCAPTCHA script — see §4.5).
- `?jsx` images render with `loading="lazy" decoding="async"`, a 200–1200w `srcset`, no `sizes`.

---

## 4. Phase 1–3 — Build the Astro site (parity)

### 4.1 Project setup (Phase 1)

**Status: done.** Astro and Qwik coexisted on the branch until the end of Phase 3 (Qwik in
`src/routes`, Astro in `src/pages`); Qwik is now removed (§2).

- `astro.config.mjs`: `site`, `output: 'static'`, `trailingSlash: 'always'`,
  `build.format: 'directory'`, `integrations: [partytownLib]` — `partytownLib` is a 10-line
  local integration that copies the Partytown library (incl. `debug/`) to `/~partytown/` on build.
  Phase 2 added the CSS/JS browser targets, the esbuild CSS minifier and `inlineStylesheets: 'never'`
  (§4.3).
- `tsconfig.json` extends `astro/tsconfigs/strict` with the `~/*` alias (until Phase 3 a separate
  `tsconfig.astro.json` was used while Qwik's tsconfig stayed in place).
- `src/global.css` stays where it is (imported by `BaseLayout.astro`), so its relative
  `url("./media/spinner.svg")` keeps working with no edit.
- Scripts (since Phase 3): `npm run dev | build | preview | check` (preview on :4173).
- Astro 7's `astro preview` runs as a background daemon; stop it with `npx astro preview stop`.
- `astro preview` returns 404 for non-slash URLs (`/faq`) — it doesn't redirect. The 301/308 redirect
  comes from Vercel's `trailingSlash` setting (§4.8) and is verified on the Vercel preview in Phase 4.

### 4.2 Layout + SEO (Phase 1)

`BaseLayout.astro` props: `title`, `description`, optional overrides for OG fields.

**Status: done — `<head>` and status codes match the baseline (local and live) on all 7 routes**
(`node compare.mjs --baseline baseline/local --candidate candidate/local`).

- Reproduce the `<head>` order from §1 exactly. The Partytown snippet is rendered by
  `src/components/Partytown.astro` (same helper and version as Qwik) so it stays second in `<head>`.
- `Schema.astro` was generated from `schema.tsx` by script so the JSON-LD object can't drift.
- Pages are shells (`src/pages/*.astro`) with the exact titles/descriptions; bodies come in Phase 2.
- Qwik's inline service-worker script is not reproduced (see §4.7).
- `<html lang="en-us">`, `<body lang="en">`.
- Canonical: `new URL(Astro.url.pathname, Astro.site)` → absolute, trailing-slashed, no query string
  (today's canonical would include a query string if one was present; for crawled URLs it is identical).
- Shared OG defaults in `src/lib/seo.ts` (today each route copy-pastes the same 7 meta tags; values
  must stay identical — only the duplication goes away).
- `Schema.astro`: same JSON object, emitted with `set:html={JSON.stringify(...)}`.
- Keep the global reCAPTCHA `<script>` in the layout during parity (scoping it is a Phase 6 change).
- Drop Qwik's `ServiceWorkerRegister` (see §4.7).

**Acceptance:** normalized `<head>` JSON for every route is identical to baseline.

### 4.3 Static components and pages (Phase 2)

**Status: done.** Server HTML of all 7 routes matches the baseline (local and live) after
normalization; all CSS is semantically identical; every non-`srcset` image is byte-identical to
production; FAQ, privacy, terms, inquiry and 404 screenshots match with 0 differing pixels at all 4
widths. Home and accommodation screenshots can only match once Phase 3 adds the scripts (their
sections start hidden and are revealed by JS; the testimonial carousel height is measured by JS).

What it took (the original table below was the starting point; these replace parts of it):

- **Icons:** not `astro-icon`. Iconify's path data isn't guaranteed to match qwikest's, so
  `src/lib/icons.ts` is generated from `@qwikest/icons@0.0.13` (byte-identical to all 82 icons in the
  baseline) and rendered by `src/components/Icon.astro`. qwikest spread the caller's props *before* its
  own, so a passed `class`/`width`/`height` never reached the server HTML — only `style` did. Kept: the
  testimonial stars have no `star_icon`/`filled_star` class in the server HTML (a client re-render
  adds them to some cards — see §4.4 and Phase 8).
- **`?jsx` images:** `src/components/ResponsiveImage.astro` calls `getImage()` per width (WebP q75,
  200–1200 w capped at the source width, duplicates dropped) and emits `srcset` without `src`/`sizes`,
  plus width/height of the largest variant. Output is byte-identical to the Qwik build locally; Vercel's
  Linux build differs by ~0.05 % in bytes (libvips), same as Qwik's own Linux builds.
- **`?url` images:** re-encoded exactly like vite-imagetools did (§1) by `reencodedUrl()` in
  `src/lib/images.ts`; verified byte-identical to the 23 production files.
- **Original images:** Astro's image import is a proxy that ships the multi-MB original as soon as any
  property is read; `metadataOf()` reads from `.clone` (as Astro's `getImage` does), which keeps
  20 MB of unreferenced originals out of `dist/`.
- **Logo SVG:** `LogoSymbol.astro` holds the svgo-optimized markup copied from the baseline HTML.
- **CSS:** module files copied byte-for-byte next to their components (`src/components/`,
  `src/components/home/`, `src/styles/` for pages). Three build settings were needed to match Qwik's
  CSS output:
  - browser targets `edge88, firefox78, chrome87, safari14` for CSS and JS (Vite 6's default, which
    Qwik used). Vite 8's default would ship native CSS nesting and drop `-webkit-backdrop-filter`,
    breaking older Safari/Chrome/Firefox. (`es2020` is left out: Vite 8 rejects it next to browser
    versions.)
  - `cssMinify: 'esbuild'` (Qwik's minifier). Lightning CSS, Vite 8's default, rewrites rules
    enough that equivalence can't be shown; with esbuild the CSSOM comparison is exact.
  - `inlineStylesheets: 'never'`: Qwik served all CSS as external files.
  Cascade order: Qwik ships one stylesheet (modules, then `global.css`); Astro ships page modules, then
  the layout bundle (header/footer modules, then `global.css`). Module rules can't collide (scoped class
  names; the only unscoped selector is `header`, used nowhere else) and `global.css` is last in both,
  so the order is equivalent.
- **Whitespace:** Astro's HTML compression removes whitespace between tags exactly like Qwik's JSX did,
  so inline layouts (icon rows, buttons) are unaffected — verified by the body diff.
- **Inquiry `min` date** is computed at build time as the no-JS fallback (§4.5 still applies).
- No hooks were added to the markup for Phase 3 scripts: they select elements by the same
  CSS-module class names Qwik's code used, so the server HTML stays identical.

Parity tooling added (`scripts/parity/`): `compare.mjs` checks `body` (normalized server HTML, line
diff), `css` (semantic CSSOM diff + raw vendor-prefixed declarations and `@import`s) and `screens`
(pixel diff ≤ 0.1 %, diff images in `<candidate>/screens-diff/`); `--routes` limits a run to some
pages; `capture.mjs` saves stylesheets (`css/`, also added to both baselines via `--css-only`).

Original plan — straight markup ports, JSX → Astro template:

| Qwik | Astro |
| --- | --- |
| `class={[a, b]}` / `class={[a, {[b]: cond}]}` | `class:list={[a, { [b]: cond }]}` |
| `style={{ backgroundImage: \`url(${x})\` }}` | `style={\`background-image: url(${x})\`}` (keep identical inline style strings) |
| `{list.map(...)}` | same |
| `<X />` from `img?jsx` | `<Image>` / `<Picture>` from `astro:assets` configured to reproduce §1 (WebP, q75, widths `[200,400,600,800,1200]`, same `width`/`height`, same `loading`/`decoding`) — or a tiny `QImg.astro` wrapper using `getImage()` to emit the exact same `<img srcset>` |
| `img?url` | `import x from '...webp'` → use the **original** file URL (`x.src`) — no re-encoding in parity phase |
| `Logo-Symbol.svg?jsx` | Astro SVG component import (`import Logo from '~/media/Logo-Symbol.svg'`), passing the same `class` |
| `@qwikest/icons` | ~~`astro-icon` `<Icon>`~~ — superseded: generated `Icon.astro`, see above |
| `onClick$={() => nav('/x')}` on `<button>` | keep the `<button>` (styling depends on it) + script `location.href = '/x/'` |

Icon mapping (not used — kept for reference if icons ever move to Iconify):

| Qwik | Iconify |
| --- | --- |
| `IoLogoFacebook` / `IoLogoInstagram` / `IoLogoYoutube` / `IoLogoWhatsapp` | `ion:logo-facebook` / `ion:logo-instagram` / `ion:logo-youtube` / `ion:logo-whatsapp` |
| `IoChevronForwardOutline` / `IoChevronBackOutline` | `ion:chevron-forward-outline` / `ion:chevron-back-outline` |
| `IoStarSolid` / `IoCallSolid` / `IoMailSolid` | `ion:star` / `ion:call` / `ion:mail` |
| `MatHomeOutlined`, `MatKingBedOutlined`, `MatPhotoLibraryOutlined`, `MatExploreOutlined`, `MatMailOutlined`, `MatCloseOutlined`, `MatBlurOnOutlined` | `ic:outline-home`, `ic:outline-king-bed`, `ic:outline-photo-library`, `ic:outline-explore`, `ic:outline-mail`, `ic:outline-close`, `ic:outline-blur-on` |

Order: Footer, FloatingButton, FAQ, Privacy, Terms (no JS) → Header → home sections → Accommodation
page → Inquiry.

**Acceptance (per page):** JS-disabled HTML matches baseline structurally (same elements, text, classes
modulo CSS-module hashes, same inline styles); screenshots at all 4 widths match baseline.

### 4.4 Interactive behaviour (Phase 3)

**Status: done.** All `useVisibleTask$` code and the inquiry form are ported; checked against the live
site with Playwright probes (post-JS `class`/inline style of every home element at 13 scroll positions,
38 testimonial-carousel states at 375/1280, 24 inquiry-form states incl. mocked success/error
submissions, accommodation reveal, header/menu/navigation buttons) — all identical. The one difference
is timing: the hero auto-rotation starts slightly earlier than on Qwik (Qwik first lazy-loads the
task's chunk), so the 15 s slide changes happen a little sooner.

How it's done (this replaces the sketch further down):

- `src/lib/qwik-runtime.ts` reproduces the Qwik semantics the ports depend on: `onVisible` (default
  strategy: first intersection of the component root), `onIdle` (`document-idle`), `cx` (Qwik's class
  serialization), `createRenderer` (state-bound `class`/`style`/`disabled`/`value` re-rendered on the
  next macrotask, written only when they differ from the last *rendered* value, a changed
  `class`/`style` replacing the whole value — which wipes inline styles set directly, as on Qwik),
  `createTask` (tracked tasks re-run after the render, previous cleanup first) and `navigate`
  (`useNavigate()` to the current path only scrolls to the top).
- Each component's `<script>` is its `useVisibleTask$` bodies line for line. Class maps and image URLs
  reach the script as JSON via `src/components/ScriptData.astro` — importing a `.module.css` in a client
  script would make Astro emit that CSS twice. Scripts and `<template>`s sit after the component root, so
  no position-based selector is affected; the body check drops inert `<template>`s.
- **Testimonials:** cards are cloned from per-testimonial `<template>`s (generated by
  `TestimonialCard.astro`) and reconciled by key like Qwik's JSX. Two Qwik behaviours found on the live
  site are reproduced: (1) the server-rendered card's stars are re-rendered on the component's first
  client render, and a client-created card's stars when it becomes the outgoing card — qwikest then
  applies `width="20" height="20"` and `star_icon filled_star` (the star wrapper is 20 px instead of
  23 px tall, which shows in the 375 px layout); (2) from the second transition on, the outgoing card
  shows the *incoming* testimonial's text (a created card's text stayed bound to
  `transitioningTo.index`; its avatar `src`/`alt` don't change). Both are in Phase 8.
- **Inquiry:** CAPTCHA isolated in `src/components/inquiry/captcha.ts` (`ensureRendered`, `getToken`,
  `reset`). The arrival `min` is set on load (the server value is the build date).

General translation pattern (original sketch) for each `useVisibleTask$`:

```astro
<section id="gallery" class={styles.gallery} data-gallery>…</section>

<script>
  import styles from "./gallery.module.css";   // same hashed class names as the markup
  import { initRevealParallax } from "~/lib/parallax";
  document.querySelectorAll("[data-gallery]").forEach((el) => initRevealParallax(el, styles, { threshold: 0.2 }));
</script>
```

- Port the existing logic line-for-line (same thresholds, factors, clamps, timings, rAF throttling).
  Gallery, Explore and Testimonial share identical parallax math → one helper in `src/lib/parallax.ts`.
- Qwik's default `useVisibleTask$` strategy runs on first visibility; the components already gate
  themselves on IntersectionObserver/scroll checks, so running on module load is equivalent. Where a
  task used the default strategy (Header, Home, Intro, Accommodation page), verify the first-paint state
  is identical in screenshots.
- **Initial classes/styles** must come from the server markup exactly as Qwik rendered them, e.g.:
  hero slide 0 has `slide_active`; parallax inline styles start at `translateY(0px)`; testimonial card 0
  has `slideInInitial`; carousel `style="height: 290px"`.

Component-specific notes:

- **Hero:** keep slide markup static; script toggles `slide_active` / `thumb_active`. Keep the exact
  800 ms / 1500 ms / 15 s timings and the `isTransitioning` lock. Parallax updates
  `transform` on all slide images and text blocks on scroll (rAF-throttle it; output is the same).
- **Testimonials:** render the first card server-side; render every testimonial into a `<template>`
  (same card markup, generated by the same Astro sub-component so it can't drift). On prev/next, clone
  the target template, append it with `slideInRight/Left`, set the current card to
  `slideOutLeft/Right`, and after 500 ms remove the old card — reproducing the two-card DOM Qwik
  renders mid-transition. Keep the avatar fallback (`onerror` → placeholder) and height measurement.
- **Accommodation teaser:** the inline background image switches between `img1.webp` and
  `img1-sm.webp` at 876 px — same as today (SSR renders the large one first).
- **Header menu:** `navigation` global class + module `active` class toggled exactly as today.

### 4.5 Inquiry form

Vanilla script mirroring `src/routes/inquiry/index.tsx`:

- Same field ids/names, same validation order and messages, same email regex, same
  `grecaptcha.getResponse().length > 10` check.
- `preventdefault:submit` → `form.addEventListener('submit', e => e.preventDefault())`; submission
  handler on the submit button's click (Enter-key submission still clicks the submit button, as today).
- Same `POST ${import.meta.env.PUBLIC_API_URL}/reservation` with the same JSON body keys
  (`salutation, fullName, country, telephone, email, arrival, departure, guestCount, otherInfo`).
- Loader overlay (`.loading-overlay`) and toast (`.toast`, `.toast-error`, click to dismiss) inserted /
  removed exactly as today. Reset restores defaults and calls `grecaptcha.reset()`.
- Arrival/departure `min` logic identical.
- **Static-build gotcha:** today the arrival `min` attribute is computed at *request* time on the server.
  In a static build it would be frozen at *build* time — so set it in the client script on load (and keep
  it in the markup only as a fallback). Same for the departure `min` (already client-side).
- reCAPTCHA: the `div.g-recaptcha[data-sitekey]` auto-renders when `api.js` loads. Keep the existing
  guarded explicit `grecaptcha.render` fallback, but wait for `grecaptcha` to exist
  (`grecaptcha.ready` / onload callback) instead of assuming it is loaded. This is a parity port only —
  reCAPTCHA is replaced by Turnstile in Phase 6, so keep the CAPTCHA code isolated in one small module
  (`src/components/inquiry/captcha.ts`: `getToken()`, `reset()`) to make that swap a one-file change.
- Test a real submission against the Firebase function from a preview deploy (CORS must allow the
  preview origin — check the function's allowed origins).

### 4.6 404 page

**Status: done.** The baseline showed that Qwik City serves its plain built-in 404 page (no site
layout, no doctype, blue "404 Resource Not Found" box). For parity it is reproduced byte-for-byte as
`public/404.html` (copied from the baseline capture). A branded 404 is a Phase 8 item. Confirm Vercel
returns HTTP **404** (not 200) for unknown paths in Phase 4.

### 4.7 Service worker cleanup

**Status: done.** The baseline showed Qwik 1.16 already **unregisters** its service worker on every
page load (inline script in `<head>`) and deletes the `QwikBuild*` cache, and the live
`/service-worker.js` has no fetch handler. So only visitors who haven't been back since older Qwik
versions still have an active worker. `public/service-worker.js` replaces it at the same URL: on
activate it deletes `QwikBuild*` caches and unregisters itself. Nothing registers a service worker any
more. Keep the file for at least a few months after launch.

### 4.8 Deployment config

**Status: repo side done** (`vercel.json`: `framework: astro`, `trailingSlash: true`, `/_astro/(.*)`
immutable cache rule; `engines.node >= 22.23.4`). Still to do in the Vercel dashboard before the first
preview deploy: set the project's Node version to 22.x (≥ 22.23.4) and check `PUBLIC_API_URL` exists
for Preview and Production. Redirects (`/faq` → `/faq/`, 308) can only be verified on a Vercel deploy —
`astro preview` returns 404 for slashless URLs.

- Vercel project: framework preset **Astro**, build `astro build`, output `dist` (or set
  `"framework": "astro"` in `vercel.json`). Do this on a preview deployment first.
- `vercel.json`:
  - replace the `/build/(.*)` cache rule with `/_astro/(.*)` (Astro's hashed asset dir);
  - add `"trailingSlash": true` so `/faq` → `/faq/` like today. Vercel answers this with **308**
    where Qwik answered **301**; both are permanent redirects and are treated the same by search
    engines, so this is an accepted difference (query strings must still be preserved).
- Set `PUBLIC_API_URL` for Preview and Production environments.
- HTML caching: Qwik set `max-age=5, stale-while-revalidate=604800`; Vercel's static default (CDN cache,
  revalidated on deploy) is equivalent or better — no config needed.

---

## 5. Phase 4 — Verification (parity sign-off)

Run the Phase 0 capture against `astro build && astro preview` into `candidate/local`, then against the
Vercel preview URL, and compare with `node compare.mjs` (checks: `head`, `responses`, `body`, `css`,
`screens`; animation-state screenshots in `states/` are still compared by eye).

| Check | Pass criteria |
| --- | --- |
| `<head>` diff per route | Identical normalized JSON (asset hash URLs excluded) |
| JSON-LD | Byte-identical; validates in Google Rich Results Test |
| Server HTML (JS off) | Same structure, text, inline styles |
| Screenshots 375/768/1280/1920 | Pixel diff ≤ 0.1 % (fonts/AA noise); any larger diff reviewed by eye |
| Animation checkpoints | Header sticky, hero slide 2 after click, each reveal state, mobile menu open, testimonial next/prev mid-transition |
| Manual side-by-side | Full scroll on `/` vs baseline video (parallax feel), hero auto-advance after 15 s, resize across 876 px and 460 px |
| URLs | All 6 routes 200 at trailing-slash URL; non-slash → permanent redirect (301/308) → slash, query kept; unknown path 404. (Accepted difference: on the Qwik site an unknown `/assets/…` URL returns an empty **200**; static hosting returns 404.) |
| Sitemap / robots | `/site/sitemap.xml`, `/robots.txt`, `/manifest.json`, `/manifest.webmanifest`, `/favicon.svg` byte-identical |
| Inquiry | Validation messages in order; captcha renders; success + error toast; reset |
| Lighthouse | Every category ≥ baseline (SEO and Accessibility must be equal or higher) |
| Browsers | Chrome, Safari (iOS + macOS), Firefox, Android Chrome |
| Service worker | In a browser with the old site's SW installed, visiting the preview unregisters it and loads fresh |

---

## 6. Phase 5 — Launch

1. Merge `astro-migration` → `main` only after Phase 4 sign-off.
2. Production deploy; immediately re-run the parity script against `https://www.knucklesretreat.com`.
3. Google Search Console: resubmit the sitemap, run URL Inspection on the 6 routes, watch the
   Coverage/Pages report for a week.
4. Rollback: Vercel Instant Rollback to the last Qwik deployment (keep it un-deleted).
5. Update `CLAUDE.md`: Astro commands and structure, remove the Qwik commands and the parity-only
   rules, and point to Phase 6 as the current work.

---

## 7. Phase 6 — Cloudflare Turnstile + backend verification

Starts after the Astro site is live and stable (Phase 5 monitoring done). Ships as its own PR in this
repo **plus** a change in the Firebase Functions repo.

### 7.1 Why

The current reCAPTCHA is checked in the browser only: `validateForm()` calls `grecaptcha.getResponse()`,
but the token is **never sent** to `POST ${PUBLIC_API_URL}/reservation` (the body is just `formData`).
The Firebase function therefore cannot verify it, and anyone can POST to the endpoint directly. The
CAPTCHA currently provides no server-side protection. This phase fixes that and switches to Turnstile
(free, no puzzle for most visitors, no Google tracking cookies).

### 7.2 Cloudflare setup

1. Cloudflare dashboard → Turnstile → add a widget (mode: **Managed**).
2. Hostnames: `knucklesretreat.com`, `www.knucklesretreat.com` (add the Cloudflare preview hostname
   later in Phase 7). For local dev and Vercel previews use Cloudflare's **test keys** instead of adding
   those hostnames:
   - site key `1x00000000000000000000AA` (always passes) / `2x00000000000000000000AB` (always blocks)
   - secret `1x0000000000000000000000000000000AA` (always passes) /
     `2x0000000000000000000000000000000AA` (always fails) /
     `3x0000000000000000000000000000000AA` (token already spent)
3. Store keys:
   - site key → `PUBLIC_TURNSTILE_SITE_KEY` (public, inlined at build; per environment in Vercel);
   - secret → Firebase secret: `firebase functions:secrets:set TURNSTILE_SECRET_KEY` (never in this repo).

### 7.3 Frontend changes (this repo)

- Remove the global `<script src="https://www.google.com/recaptcha/api.js">` from `BaseLayout.astro`
  (this also ends loading a CAPTCHA script on every page).
- On `/inquiry/` only, load
  `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer>`.
- Replace `<div class="g-recaptcha" id="kr-g-recaptcha" data-sitekey="…">` with a container
  `<div id="kr-turnstile" class="cf-turnstile"></div>` and render explicitly once the API is ready:
  `turnstile.render('#kr-turnstile', { sitekey, action: 'reservation', 'refresh-expired': 'auto' })`.
- Swap the implementation inside `captcha.ts` (§4.5): `getToken()` → `turnstile.getResponse(widgetId)`,
  `reset()` → `turnstile.reset(widgetId)`. The form code itself does not change.
- Send the token: add `turnstileToken` to the JSON body of the `/reservation` request.
- Reset the widget after every submission, success **or** failure (tokens are single-use and expire
  after 300 s) — the existing `resetFrom()` already does this via `captcha.reset()`.
- Validation message: replace "reCAPTCHA not confirmed…" with "Please complete the verification check."
- Styles: replace the `.g-recaptcha` scale rules in `global.css` (≤ 785 px and ≤ 320 px) with
  `.cf-turnstile` equivalents. Turnstile's widget is ~300×65 vs reCAPTCHA's 304×78, so **screenshot-review
  the form at 320/375/768/1280 px** — this is an intentional, small visual change.
- Types: replace `grecaptcha` in `src/types/index.d.ts` with a `turnstile` declaration.
- Privacy policy: add a sentence that Cloudflare Turnstile is used to protect the inquiry form from spam.
- Error handling: if the backend responds 403 (verification failed), show the existing error toast and
  reset the widget — no new UI.

### 7.4 Backend changes (Firebase Functions repo)

In the `reservation` handler, **before** any other work (email, database write):

```ts
const TURNSTILE_SECRET_KEY = defineSecret("TURNSTILE_SECRET_KEY");

async function verifyTurnstile(token: string | undefined, ip: string | undefined) {
  if (!token) return { success: false, reason: "missing-token" };
  const body = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY.value(), response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = await res.json();
  const okHost = ["knucklesretreat.com", "www.knucklesretreat.com"].includes(data.hostname);
  return { success: data.success === true && okHost && data.action === "reservation", data };
}
```

- On failure return HTTP **403** with `{ status: "error", message: "Verification failed" }` (the
  frontend already treats any non-`success` status as an error).
- Strip `turnstileToken` from the payload before storing/emailing it.
- Bind the secret to the function (`secrets: [TURNSTILE_SECRET_KEY]`); outbound `fetch` requires the
  Blaze plan, which Cloud Functions already need.
- Log failures with `error-codes` from the siteverify response (no token values in logs).
- Recommended while touching the handler: re-validate required fields server-side (same rules as the
  form) and keep CORS restricted to the production origins (+ preview origins as needed).

### 7.5 Rollout (no window where the form is broken)

The frontend and backend deploy separately, so order matters:

1. **Backend, soft mode.** Deploy verification that *verifies when a token is present* but still
   accepts requests without one (log them as `missing-token`). Old frontend keeps working.
2. **Frontend.** Deploy the Turnstile form. All real submissions now carry a token; check the function
   logs show successful verifications from production.
3. **Backend, enforce.** After ~1 week of clean logs (no legitimate `missing-token` requests), make a
   missing or invalid token return 403.
4. Delete the old reCAPTCHA keys in the Google reCAPTCHA / Cloud console.

### 7.6 Verification

| Check | Pass criteria |
| --- | --- |
| Normal submission | Widget renders, success toast, email/record received |
| Token required | `curl -X POST …/reservation` without a token → 403 (after enforce step) |
| Bad token | Test secret `2x…AA` in a staging function → 403, error toast, widget resets |
| Replay | Resubmitting the same token → 403 (`timeout-or-duplicate`) |
| Expiry | Leave the form > 5 min, then submit → widget auto-refreshes, submission succeeds |
| Other pages | No Turnstile or reCAPTCHA script requested outside `/inquiry/` |
| Visual | Form screenshots at 320/375/768/1280 reviewed; rest of site unchanged vs post-launch baseline |

---

## 8. Phase 7 — Move hosting from Vercel to Cloudflare

After Phase 6 is enforced and stable. The site is fully static by now, so this is a configuration
change, verified with the same parity script.

1. **Project:** Cloudflare Workers with static assets (Cloudflare's recommended path for new projects
   over Pages). `wrangler.jsonc`:
   ```jsonc
   {
     "name": "knuckles-retreat",
     "compatibility_date": "<pin at setup>",
     "assets": {
       "directory": "./dist",
       "html_handling": "auto-trailing-slash",   // /faq → /faq/, as today
       "not_found_handling": "404-page"          // serves dist/404.html with HTTP 404
     }
   }
   ```
   Connect the GitHub repo with Workers Builds (build: `npm run build`).
2. **Env vars:** set `PUBLIC_API_URL` and `PUBLIC_TURNSTILE_SITE_KEY` as **build-time** variables.
3. **Headers:** move the cache rule from `vercel.json` to `public/_headers`:
   ```
   /_astro/*
     Cache-Control: public, max-age=31536000, immutable
   ```
4. **Allow-lists:** add the `*.workers.dev` preview hostname to the Turnstile widget and to the Firebase
   function's CORS / hostname checks (or use test keys on previews).
5. **Verify on the preview URL:** re-run the full Phase 4 parity suite + Phase 6 form checks.
6. **DNS cut-over:**
   - Lower DNS TTL a day in advance (or move the domain's DNS to Cloudflare first, if it isn't already).
   - Attach `www.knucklesretreat.com` and `knucklesretreat.com` as custom domains; reproduce the
     apex↔`www` and `http`→`https` redirects captured in Phase 0 (Cloudflare redirect rule).
   - Remove the preview hostnames from the Turnstile/CORS allow-lists once live, if they were only
     needed for testing.
7. **After cut-over:** re-run the parity suite and redirect checks against production; check Search
   Console for crawl errors for a week.
8. **Rollback:** keep the Vercel project and its last deployment for at least 2–4 weeks; rollback =
   point DNS back to Vercel. Within Cloudflare, previous Worker versions can be rolled back from the
   dashboard or `wrangler rollback`.
9. **Cleanup:** delete `vercel.json`, `.vercel/`, and the Vercel project once stable.

---

## 9. Phase 8 — Post-migration improvements (each a separate PR, each re-verified)

These are deliberately **out of scope** for parity because they change output. Listed by impact.

1. **Image weight.** Six source images are 2–4 MB (`explore/img1–4.webp`, `home/bg2–4.webp`). The
   `?url` ones (Explore grid, Gallery, backgrounds) ship at full resolution today (re-encoded at q80,
   see §1). Use `getImage()` for CSS backgrounds and
   `<Picture>` with sensible widths. Visually compare — sharpness on large screens may *improve* (hero
   slides are capped at 1200 w today).
2. **Partytown:** it forwards `dataLayer.push`, but no GTM/gtag script exists in the repo. Either add the
   intended analytics tag as `type="text/partytown"` or remove Partytown.
3. **Poppins font:** `global.css` sets `* { font-family: "Poppins" }` but there is no `@font-face`, and
   `public/fonts/poppins-*.woff2` are never referenced. Component CSS overrides it almost everywhere
   (Nunito Sans ×46, Kaushan Script ×6, Montserrat ×5, Source Sans 3 ×4), so only elements without a
   component font fall back to the browser's `sans-serif`. Either load Poppins (changes those elements)
   or drop the rule and the unused woff2 files — decide deliberately and screenshot-review.
4. **Google Fonts request:** all four families are used, but the `@import` pulls many unused weights and
   italics (e.g. Nunito Sans 200–900 plus italics). Trim to the weights the CSS uses, and consider
   `<link rel="preconnect">` + `<link>` instead of a CSS `@import` (which delays font discovery).
5. **Inquiry country select:** the "Please select" option has no `value=""`, so re-selecting it passes
   validation as a country. Add `value=""` (and the same check server-side, §7.4).
6. **Sitemap:** replace the hand-maintained `public/site/sitemap.xml` with `@astrojs/sitemap` (keep the
   `/site/sitemap.xml` path or update `robots.txt` and resubmit in Search Console).
7. **Content collections** for rooms, testimonials and FAQ (typed via a zod schema).
8. **Branded 404 page** using the site layout, with `<meta name="robots" content="noindex">` (today it
   is Qwik's plain default page, reproduced as `public/404.html` for parity).
9. Optionally add Astro View Transitions (`<ClientRouter />`) for SPA-like navigation — re-check all
   scripts re-initialise on `astro:page-load` if adopted. (Qwik City injected
   `:root{view-transition-name:none}` on every page; it's not reproduced since nothing uses it.)
10. **Testimonial stars:** the `star_icon` / `filled_star` / `half_filled_star` / `empty_star` classes
    are missing from the server HTML and from client-created cards (qwikest dropped them); they only
    appear after certain client re-renders (§4.4), which also changes the card height by 3 px. Stars
    render in the inherited text colour and half/empty stars can't show. Render the classes
    consistently — changes the look, so decide and screenshot-review.
11. **Internal links without trailing slash:** header/footer/FAQ links use `/inquiry`, `/faq`,
    `/accommodation`, … so every click costs a redirect hop to the slashed URL. Link to `/inquiry/` etc.
12. **Testimonial transition shows the wrong text:** from the second prev/next on, the card sliding
    out displays the incoming testimonial's text under the old avatar (§4.4). Keep each card's content
    fixed while it animates out.

---

## 10. Estimated effort

| Phase | Effort |
| --- | --- |
| 0 Baseline tooling + capture | 0.5 day |
| 1 Setup, layout, SEO | 0.5 day |
| 2 Static markup, images, icons | 1 day |
| 3 Interactivity + inquiry form | 1–1.5 days |
| 4 Verification + fixes | 1 day |
| 5 Launch + monitoring | 0.5 day (+ a week of passive monitoring) |
| **Subtotal: Astro parity launch** | **≈ 4.5–5 days** |
| 6 Turnstile (frontend + Firebase function + staged rollout) | 1 day (+ ~1 week soft-mode observation) |
| 7 Cloudflare hosting + DNS cut-over | 0.5–1 day (+ a week of monitoring) |
| 8 Improvements | per item, 0.5–1 day each |

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| Subtle animation timing differences | Line-for-line port of timings; checkpoint screenshots + side-by-side video |
| Image `srcset`/dimension changes shift layout | Reproduce Qwik's `?jsx` directives exactly in parity phase; compare `<img>` attributes in HTML diff |
| URL / trailing-slash drift hurting SEO | `trailingSlash: 'always'` + Vercel `trailingSlash: true`, then Cloudflare `auto-trailing-slash`; automated redirect checks after every phase |
| Stale Qwik service worker on returning visitors | Kill-switch `service-worker.js` (§4.7) |
| Arrival-date `min` frozen at build time | Set on the client (§4.5) |
| Firebase CORS rejects preview domain | Test from preview early in Phase 3; update allow-list in Phase 7 |
| Icon glyph differences | Resolved in Phase 2: icons generated from qwikest, byte-identical to the baseline |
| Different CSS lowering/minification (Vite 8 vs Qwik's Vite 6) | Resolved in Phase 2: Qwik's browser targets + esbuild minifier; `compare.mjs --only css` proves equivalence |
| Inquiry form broken mid-Turnstile rollout | Backend soft mode → frontend → enforce (§7.5) |
| Turnstile blocks real guests (e.g. privacy browsers, strict networks) | Managed mode; watch `error-codes` in function logs during soft mode before enforcing |
| Turnstile hostname mismatch on new host | Add preview/production hostnames before Phase 7 cut-over; hostname check in §7.4 |
| DNS cut-over downtime / lost apex→www redirect | Low TTL in advance; redirects captured in Phase 0 and re-checked; Vercel kept for rollback |
