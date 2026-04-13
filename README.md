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

## Testing

The project uses **Vitest** for unit/integration tests and **Playwright** for browser E2E tests.

### Quick commands

```bash
npm test            # Run all unit & integration tests once
npm run test:watch  # Run tests in watch mode during development
npm run test:unit   # Verbose unit test output
npm run test:e2e    # Run Playwright E2E suite
npm run test:e2e:ui # Run Playwright with interactive UI
npm run typecheck   # TypeScript type checking
npm run check       # lint + typecheck + unit tests (full local gate)
```

### Test structure

```
tests/
  setup/            Vitest setup files (jest-dom matchers, etc.)
  helpers/          Shared test utilities (mock Supabase client, etc.)
  unit/             Pure unit tests — no network, no side effects
    lib/            Logger tests
    openai/         Prompt builder, SSE encoder tests
    personas/       Persona registry and resolution tests
  integration/      Tests with mocked boundaries (route handler tests)
  e2e/              Playwright browser tests
    .auth/          Stored auth session state (gitignored)
    smoke.spec.ts   Public page and redirect checks
    persona-chat.spec.ts  Authenticated chat flow tests
```

### E2E environment variables

To run the authenticated E2E tests locally or in CI, set these additional variables:

| Variable | Description |
|----------|-------------|
| `E2E_BASE_URL` | Base URL for E2E tests (default: `http://localhost:3000`) |
| `E2E_USER_EMAIL` | Supabase test user email for authenticated flows |
| `E2E_USER_PASSWORD` | Supabase test user password |

The E2E suite uses a storage-state approach: the `auth.setup.ts` file logs in once and saves the session, which all authenticated test specs reuse. This avoids automating Google OAuth directly.

## Logging

Server-side logging uses a structured JSON logger at `src/lib/logger.ts`. All log entries include:

- `level` — debug, info, warn, or error
- `ts` — ISO 8601 timestamp
- `event` — dot-namespaced event name (e.g. `persona.chat.request`)

The Persona chat pipeline logs these events:

| Event | Level | When |
|-------|-------|------|
| `persona.chat.unauthorized` | warn | Auth check fails |
| `persona.chat.empty_message` | warn | Empty message submitted |
| `persona.chat.request` | info | Chat request starts processing |
| `persona.chat.completed` | info | Stream finishes with token usage |
| `persona.chat.stream_error` | error | OpenAI stream failure |
| `persona.chat.fatal` | error | Unhandled route error |
| `persona.chat.created` | info | New chat row created |
| `persona.chat.deleted` | info | Chat deleted |
| `persona.profile.backfill` | info | Missing profile row auto-created |
| `persona.project.create` | info | Default project created |

### Privacy

The logger intentionally does **not** log: raw user prompts, assistant outputs, system prompts, retrieved context, or secrets/tokens. Only structural metadata (IDs, counts, durations, token usage) is emitted.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

1. **quality** — lint, typecheck, unit/integration tests
2. **build** — production build verification
3. **e2e** — Playwright smoke tests (main branch pushes only, requires secrets)

## Deployment

Deployed on Vercel with custom domain via Cloudflare DNS.
