@AGENTS.md

# varun-personal-site

Personal website for varunpatel.me. Deployed on Vercel, DNS on Cloudflare.

## Stack

- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS v4 (CSS-based config, no tailwind.config.ts)
- Geist Sans + Geist Mono fonts

## Architecture

- `src/app/` — Routes and layouts (App Router conventions)
- `src/components/` — Reusable UI components
- `src/data/` — Static data (projects, navigation)
- `src/lib/` — Shared utilities and constants

## Conventions

- Dark mode only (zinc palette)
- All theme tokens defined in `globals.css` via `@theme inline`
- Shared layout in root `layout.tsx` with Navbar + Footer
- Page-specific metadata exported from each route's `page.tsx`
- `clsx` for conditional classnames
