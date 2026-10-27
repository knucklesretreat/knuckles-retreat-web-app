# Knuckles Retreat website

Marketing site for a resort in Sri Lanka: https://www.knucklesretreat.com. Seven routes (`/`,
`/accommodation/`, `/inquiry/`, `/faq/`, `/privacy-policy/`, `/terms-and-conditions/`, 404). Content is
hardcoded or comes from `src/data/*.json`. The only backend call is the inquiry form, which POSTs to
`${PUBLIC_API_URL}/reservation`: a Firebase Cloud Function kept in a **separate repo**.

## Current state: migrating Qwik → Astro

- Branch `astro-migration`. The plan in `docs/astro-migration-plan.md` is the source of truth for scope,
  order and acceptance criteria. Read the relevant phase before starting work, and keep the plan
  updated when facts change.
- Order: Astro parity on Vercel (Phases 0–5) → Turnstile + backend verification (6) → Cloudflare
  hosting (7) → improvements (8). Each one ships and is verified separately.
- Phase 0 (baseline) is done. Check `git log` and the plan to see which phase is in progress.

## Parity rules (Phases 1–5)

The migrated site must look, animate and index exactly like the Qwik site.

- Copy CSS (`*.module.css`, `global.css`) byte-for-byte. The only allowed edit is a relative `url()`
  path that breaks because a file moved.
- Port `useVisibleTask$` logic line for line: same thresholds, parallax factors, clamps and timings.
- Initial server HTML must match Qwik's SSR output: classes, inline styles, attributes, `<head>` order.
- Keep known quirks (missing Poppins `@font-face`, the "Please select" country bug, reCAPTCHA on every
  page, the no-op Partytown). They are listed in Phase 8 of the plan; don't fix them during parity.
- Don't change markup semantics for style (e.g. a `<button>` that navigates stays a `<button>`).
- If parity seems impossible, stop and ask. Don't approximate silently.

## Parity tooling: `scripts/parity/`

Has its own `package.json`; see its `README.md`. The baseline from Qwik commit `817c272` is in
`scripts/parity/baseline/{local,live}/`. Screenshots and video are gitignored and exist only on the
developer's machine; regenerate them from that commit if they're missing. Write captures of the new
site to `scripts/parity/candidate/`, never over `baseline/`.

A phase is done only when its acceptance checks in the plan pass against the baseline. Report diffs
honestly, including ones that look like noise.

## Commands

Qwik (until it's removed):

```sh
npm run dev                                  # dev server
npm run build.client && npm run build.preview && npx vite preview --port 4173   # production preview
npm run build.types && npm run lint
```

Parity capture (production preview must be running on :4173):

```sh
cd scripts/parity && node capture.mjs --base http://localhost:4173 --out candidate/local
```

## Project facts

- Canonical host is `www.knucklesretreat.com`. URLs have trailing slashes (`/faq` → 301 → `/faq/`).
- `public/site/sitemap.xml` is hand-maintained; `robots.txt` points to that path.
- `PUBLIC_API_URL` is inlined at build time (`.env` locally, Vercel env vars in deploys).
- Images live in `src/media/` (some sources are 2–4 MB; don't re-encode them during parity).

## Workflow

- Commit only when asked. Work on `astro-migration`, never directly on `main`.
- Don't submit the real inquiry form against the production API while testing.
