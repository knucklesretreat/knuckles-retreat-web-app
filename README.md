# Knuckles Retreat Official Website

Live site: [https://www.knucklesretreat.com](https://www.knucklesretreat.com)

Built with [Astro](https://astro.build/) as a static site and deployed to **Vercel**.

## Tech Stack

| Area        | Tooling                                                                |
| ----------- | ---------------------------------------------------------------------- |
| Framework   | Astro 7 (static output, no UI framework; page scripts in `<script>`)   |
| Language    | TypeScript 5                                                           |
| Hosting     | Vercel (static)                                                        |
| Backend API | Firebase Cloud Functions (separate repo; the inquiry form POSTs to it) |

## Development

Needs Node ≥ 22.23.4. `PUBLIC_API_URL` (the Functions base URL) is read from `.env` at build time.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run preview    # serves dist/ on :4173 (stop with `npx astro preview stop`)
npm run check      # types (astro check)
npm run lint
```

## Layout

- `src/pages/`: one file per route
- `src/layouts/BaseLayout.astro`: `<head>`, header, footer
- `src/components/`: sections and shared components
- `src/data/*.json`: rooms, testimonials, countries, schema.org data
- `src/lib/`: image helpers, icons, SEO metadata, the client runtime the page scripts use
- `public/`: copied as-is (`site/sitemap.xml` is maintained by hand)

The site was migrated from Qwik; see `docs/astro-migration-plan.md`.
