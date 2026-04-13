# varunpatel.me

Personal website and platform foundation. Built with Next.js 16, TypeScript, and Tailwind CSS.

## Development

```bash
npm run dev     # Start dev server at http://localhost:3000
npm run build   # Production build
npm run lint    # Run ESLint
```

## Structure

```
src/
  app/            Routes and layouts (App Router)
    (marketing)/  Public site: /, /about, /projects, /lab
    (platform)/   Product apps: /apps/persona (auth-protected)
    (auth)/       Auth pages: /sign-in
    api/          API routes
  components/     Shared UI components
  features/       Feature modules (one per app)
    persona/      Persona chat app: components, lib, hooks, types
  config/         Platform-wide config (app registry)
  data/           Static data and types
  lib/            Shared utilities, site config, Supabase clients
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for Persona chat |
| `PERSONA_CHAT_MODEL` | No | Override chat model (default: `gpt-4.1-nano`) |

## Persona Chat Setup

The Persona app requires database tables for chats and messages.

1. Run the base schema in Supabase SQL Editor: `supabase/schema.sql`
2. If upgrading from a previous version, run: `supabase/migrations/20260413_persona_chat_v1.sql`
3. Add your `OPENAI_API_KEY` to `.env.local`
4. Start the dev server: `npm run dev`
5. Sign in and visit `/apps/persona`

## Deployment

Deployed on Vercel with custom domain via Cloudflare DNS.
