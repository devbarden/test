# CLAUDE.md

Guidance for Claude Code (and people) working in this repository.

## What this is

**Alt+Shift** — a cover-letter generator. Two screens: a dashboard of saved
letters and an editor that streams a new letter from the Generation API.
The product goal is to get a job seeker to five letters.

TanStack Start (React 19, Nitro) + Clerk + Prisma/Postgres + Redis, deployed
to Railway. `docs/architecture.md` explains the backend in depth — read it
before changing anything under `src/backend` or a `*.server.ts` file.

## Commands

```bash
npm run db:up               # Postgres + Redis in Docker (dev and test)
npm run dev                 # http://localhost:3000
npm run lint                # Biome + comment banners + architecture
npm run typecheck
npm test                    # unit tests (no I/O)
npm run test:integration    # repository/limiter/lock against real Postgres + Redis
npm run e2e                 # Playwright, full stack with a fake Generation API
npm run db:migrate:create   # CREATE a migration from schema changes
npm run db:migrate          # create + apply locally
```

Run `npm run lint` (Biome, comment banners, architecture), `npm run
typecheck` and `npm test` before reporting a change as done.

⚠ Never run `prisma migrate reset` or point any command at a non-local
database without explicit approval. Production migrations are applied only
by Railway's pre-deploy step (`prisma migrate deploy`).

## Code style — this is strict

### Comments are box banners. There is no third option.

Every comment is either deleted or a banner. A comment explains **why** —
a constraint, a trade-off, a failure it prevents — never what the next line
does.

```ts
// ═══════════════════════════════════════════════════════════════════════════
//   Non-obvious rationale — the WHY, never the what. Top and bottom rules of
//   identical length and indentation, text on `//   ` lines between them.
//
//   A blank `//` line separates paragraphs.
// ═══════════════════════════════════════════════════════════════════════════
```

- Inside a function or JSX, the banner is indented with the code and its
  rules are shortened to keep the same right edge.
- CSS uses one block: `/* ═══…` … `═══… */` with the text indented by five
  spaces.
- YAML, `.gitignore` and `.env*` use the same shape with `#`.
- Prisma schema uses `///` doc comments on models and fields.
- Not allowed: a plain `// comment`, a trailing `code // comment`, a
  `/* block */` in TypeScript, a comment that restates the code.
- The only exceptions: `// biome-ignore <rule>: <reason>`,
  `// @ts-expect-error <reason>` and `// TODO: …`.

`npm run lint:comments` (`scripts/check-comments.ts`) enforces this and fails
the lint on any violation.

### Formatting and naming

- Biome: tabs, single quotes, no semicolons, sorted object keys, JSX
  attributes and CSS properties. `npm run biome:lint:fix` fixes it.
- `*.server.ts` is server-only and must never be imported, directly, by a
  file that reaches the client bundle. Server functions (`*.api.ts`) and
  middleware files drop the suffix because the client imports them; they
  reach services only through `context.scope.cradle`.
- Route-private files are prefixed with `-` (`-sign-in.module.css`) so the
  router ignores them.
- Services, repositories and gateways are factories `createXxx({ deps })`
  returning a plain object, typed as `ReturnType<typeof createXxx>`. No
  classes except errors.
- No barrel files in `features/` or `screens/`: import the module itself
  (`@/features/billing/hooks/use-entitlements`). A barrel there mixes
  server functions, hooks and styled UI, and importing one name drags in
  the rest — it once put the whole landing into every page's entry chunk.
  Each component folder in `components/` has a one-line `index.ts`
  (`export * from './button'`) and nothing else does.
- Files and folders are kebab-case; components are one per file.
- Imports inside one feature, one screen or one `lib/` group are relative
  (`../model/application.schema`); anything outside it goes through `@/`.

## Architecture

```
src/backend/        infrastructure — config, auth, errors, DI, middleware,
                    http, database, Redis, rate limiting, gateways, jobs,
                    lifecycle. Never imports a feature's services: only the
                    composition root (di/container.server.ts) knows them
src/routes/         thin route files: URL, guards and head() → a screen
src/screens/<x>/    one page each (landing, auth, workspace, dashboard,
                    application, billing): composes features, owns the
                    page-only UI
src/features/<x>/   one domain each (applications, billing, generation,
                    marketing), in segments:
                      model/  schemas, types, pure domain logic
                      api/    server functions, query keys/factories, cache
                      hooks/  client hooks
                      ui/     the domain's reusable components
                    plus its server side at the slice root (*.server.ts)
src/components/     design system (ui/), layout, brand, locale, seo,
                    fallbacks, clerk-boundary — know nothing of features
src/hooks/          generic React hooks
src/lib/            infrastructure safe on both sides, by concern:
                    api/ i18n/ query/ seo/ clerk/ and small helpers
```

Frontend imports flow one way — `routes → screens → features → components ·
hooks · lib` — and `npm run lint:architecture` fails on any import that
goes back up, between two screens, or between two features (the few
allowed feature dependencies are listed in `scripts/check-architecture.ts`).
Features are combined in the screen that needs them, never inside each
other: a feature that must react to another one takes a callback
(`useDeleteApplication({ onSettled })`, `useSyncPlanChanges(onChange)`).

Request path: route or server function → guard middleware (auth, budget,
scope) → service (business rules, bound to the request's user) →
repository (Prisma, every query scoped by owner) → Postgres.

### Backend rules

- **Every query is scoped by `userId` inside the repository.** Services never
  load a row by id and then check ownership.
- **Services get the user from `userActor`**, never from an argument.
  `userActor` exists only on user scopes; system code (webhooks, cron) runs
  on a system scope and cannot resolve user services.
- **Errors are `AppError`s with a code from `src/lib/api/api-error.ts`.** Adding
  a code means adding its sentence in `src/lib/api/api-error-message.ts`; the
  compiler enforces it. Nothing from an exception other than the payload may
  reach a client.
- **Every user-facing server function uses `userScopeMiddleware`; every
  cookie-authenticated `/api` route uses `userApiScopeMiddleware`** (it adds
  the CSRF check). Webhooks and cron use `systemApiScopeMiddleware` and
  authenticate by signature or secret.
- **Configuration is parsed once at boot** in `config.server.ts`. A new
  environment variable is added to its schema and to `.env.example` in the
  same change. Product limits are code in the config, not env.
- **Anything that costs money or a shared budget is rate limited** with a
  tier in `rate-limit/rate-limit-tiers.ts`, charged through a constructor
  in `rate-limit/budgets.ts` — never a hand-built key, so the code that
  charges a budget and the code that reports it hit the same counter.
- **Server function inputs go through `validateInput(schema)`**
  (`backend/middleware/validate-input.ts`), never the bare schema: TanStack
  reports a bare schema's failure as a plain `Error`, which surfaces as
  `internal` instead of `invalid_request`.
- **Features own what an event or a job means; the backend only transports
  it.** A Clerk event is handled in `features/account`
  (`account-events.service.server.ts`) after `clerkWebhookVerifier` proves
  it; a scheduled job is a feature's `x.jobs.server.ts`, merged into
  `scheduledJobs` in the container.

### Adding a server feature

1. Model in `prisma/schema.prisma`, then `npm run db:migrate:create`.
2. `x.repository.server.ts` — Prisma only, owner-scoped.
3. `x.service.server.ts` — rules, errors, logging.
4. Register both in the feature's `x.module.server.ts` (`.scoped()`) and add
   the module to `src/backend/di/container.server.ts`.
5. `x.api.ts` — `createServerFn` + `userScopeMiddleware` +
   `.validator(validateInput(schema))` + one service call.
6. `x.queries.ts` — key and query factories for the client.
7. Unit tests for the service (fakes in `src/test/fakes`), integration tests
   for the repository.

### Frontend rules

- Styles are CSS Modules that use **semantic tokens** from
  `src/styles/tokens.css` (`--color-text-secondary`), never palette values or
  raw hex.
- Server state lives in TanStack Query through the factories in
  `api/*.queries.ts`; mutations update the cache optimistically (helpers in
  `api/*.cache.ts`) and invalidate on settle.
- A route file holds only its URL concerns — params, search, guards,
  `head()`, `ssr` — and renders a screen from `src/screens`.
- Screens are named `<name>-screen.tsx`, export `<Name>Screen`, and the
  root class of their CSS module is `.screen`.
- `components/ui` is the design system. A new variant goes into the
  component, not into a one-off override at the call site.

### Translations and public pages

- Every user-visible string goes through Paraglide: `m['dotted.key']()`,
  with the key in BOTH `messages/en.json` and `messages/ru.json`. Biome's
  `noJsxLiterals` fails a raw string in JSX; `npm run i18n:check` (run by
  `typecheck`) fails a missing key or a dropped `{placeholder}`.
- Always a full, static key — never one built from a template string: a
  computed key keeps every message of every locale in the bundle.
- Nothing message-backed at module scope: a `const` holding `m[...]()`
  captures the first request's locale forever. Use functions.
- Two locale zones (see `src/lib/i18n/localized-routes.ts`): public pages carry
  the locale in the URL (`/ru/`); `/applications`, `/sign-in` and `/api`
  read the `PARAGLIDE_LOCALE` cookie and never get a prefix.
- A new public page goes into `LOCALIZED_PATHS` in `src/lib/seo/robots-and-sitemap.ts` (the
  sitemap) and gets canonical + hreflang via `src/lib/seo/seo-links.ts`;
  anything private gets `noindex` and a robots `Disallow`. `llms.txt` is
  built from the same messages (`features/marketing/llms.server.ts`).
- `VITE_SITE_URL` is the public origin, inlined at build time; without it
  every page is served noindex.

## Tests

- **Unit** (`*.test.ts`) — no network, no database; fakes for repositories
  and gateways.
- **Integration** (`*.integration.test.ts`) — real Postgres and Redis from
  `docker compose` (`db-test`, Redis db 1); each test starts clean.
- **E2E** (`e2e/`) — the real app against the test database and a local fake
  of the Generation API (`e2e/fake-generation-api.ts`), so runs are
  deterministic and never spend the shared upstream quota.

## Commits

Small, conventional (`feat(scope):`, `fix:`, `refactor:`, `test:`,
`docs:`, `chore:`), each one a single reviewable step with a body that says
why. Never commit `.env` or anything under `src/generated`.
