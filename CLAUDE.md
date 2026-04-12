@AGENTS.md

# varun-personal-site

Personal website and platform for varunpatel.me. Deployed on Vercel, DNS on Cloudflare.

## Stack

- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS v4 (CSS-based config, no tailwind.config.ts)
- Supabase (auth, database, storage)
- Geist Sans + Geist Mono fonts

## Architecture

```
src/
├── app/                    Routes and layouts (App Router conventions)
│   ├── (marketing)/        Public site: /, /about, /projects, /lab
│   ├── (platform)/         Product apps: /apps/persona, /apps/* (auth-protected)
│   ├── (auth)/             Auth pages: /sign-in
│   ├── auth/callback/      OAuth/magic-link callback handler
│   └── api/                API routes (reserved)
├── components/
│   ├── ui/                 Shared primitives (page-header, section)
│   ├── marketing/          Marketing-site components (navbar, footer, home/*)
│   └── platform/           Platform shell components (app-shell)
├── features/               Feature modules — one per app/product
│   └── persona/            Persona app: components, lib, types
├── config/                 Platform-wide config (app registry)
├── data/                   Static data (projects, navigation)
└── lib/
    ├── site.ts             Site config
    └── supabase/           Supabase clients and types
        ├── client.ts       Browser client (use in "use client" components)
        ├── server.ts       Server client (use in server components, actions, route handlers)
        ├── middleware.ts    Middleware helper (session refresh + route protection)
        └── types.ts        Database row types and Database generic
```

### Route Groups

- `(marketing)` — personal site pages with Navbar + Footer + AmbientBackground
- `(platform)` — app pages with AppShell header, auth-protected via middleware
- `(auth)` — auth pages with minimal centered layout

Route groups do not affect URLs. All share the root layout (html/body/fonts/metadata).

### Feature Modules

Each app/product lives in `src/features/{app}/` with its own components, lib, and types.
Route pages in `src/app/(platform)/apps/{app}/` are thin entry points that import from the feature module.

Dependency rule: features can import from `components/ui/`, `lib/`, and `config/`, but NEVER from `components/marketing/` or other features.

### Supabase Integration

- Browser client: `import { createClient } from "@/lib/supabase/client"` (in "use client" components)
- Server client: `import { createClient } from "@/lib/supabase/server"` (in server components/actions)
- Middleware refreshes auth session on every request and protects `/apps/*` routes
- Database types in `src/lib/supabase/types.ts` — regenerate with `supabase gen types` when schema changes
- SQL schema lives in `supabase/schema.sql`

### Auth Flow

1. Unauthenticated user visits `/apps/*` → middleware redirects to `/sign-in`
2. User enters email → receives magic link
3. Magic link → `/auth/callback` → exchanges code for session → redirects to app
4. Already signed-in user visiting `/sign-in` → redirected to `/apps/persona`

## Conventions

- Dark mode only (zinc palette)
- All theme tokens defined in `globals.css` via `@theme inline`
- Root layout is minimal (html/body/fonts only) — route group layouts handle shells
- Page-specific metadata exported from each route's `page.tsx`
- `clsx` for conditional classnames

## Adding a New App

1. Create `src/features/{app}/` with components/, lib/, types.ts
2. Create `src/app/(platform)/apps/{app}/page.tsx` (thin entry point)
3. Register in `src/config/apps.ts`
4. Feature code never imports from marketing or other features

## Environment Variables

See `.env.local.example` for required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
