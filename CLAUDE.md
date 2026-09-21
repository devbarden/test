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
npm run lint                # Biome + the comment-banner check
npm run typecheck
npm test                    # unit tests (no I/O)
npm run test:integration    # repository/limiter/lock against real Postgres + Redis
npm run e2e                 # Playwright, full stack with a fake Generation API
npm run db:migrate:create   # CREATE a migration from schema changes
npm run db:migrate          # create + apply locally
```

Run `npm run lint`, `npm run typecheck` and `npm test` before reporting a
change as done.

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
- Barrels use `export *`. A feature `index.ts` never re-exports a
  `*.server.ts` file.
- Files and folders are kebab-case; components are one per file.

## Architecture

```
src/backend/        infrastructure — config, errors, DI, middleware, clients,
                    rate limiting, gateways to third parties, health
src/features/<x>/   one domain each: schema, api (server functions),
                    service, repository, queries (client), UI
src/components/     design system (ui/) and layout — know nothing of features
src/routes/         thin route files that compose features
src/lib/            shared helpers safe on both sides
```

Request path: route or server function → guard middleware (auth, budget,
scope) → service (business rules, bound to the request's user) →
repository (Prisma, every query scoped by owner) → Postgres.

### Backend rules

- **Every query is scoped by `userId` inside the repository.** Services never
  load a row by id and then check ownership.
- **Services get the user from `userActor`**, never from an argument.
  `userActor` exists only on user scopes; system code (webhooks, cron) runs
  on a system scope and cannot resolve user services.
- **Errors are `AppError`s with a code from `src/lib/api-error.ts`.** Adding
  a code means adding its sentence in `src/lib/api-error-message.ts`; the
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
  tier in `rate-limit.server.ts`, not ad hoc.

### Adding a server feature

1. Model in `prisma/schema.prisma`, then `npm run db:migrate:create`.
2. `x.repository.server.ts` — Prisma only, owner-scoped.
3. `x.service.server.ts` — rules, errors, logging.
4. Register both in `src/backend/di/container.server.ts` (`.scoped()`).
5. `x.api.ts` — `createServerFn` + `userScopeMiddleware` + a zod input
   validator + one service call.
6. `x.queries.ts` — key and query factories for the client.
7. Unit tests for the service (fakes in `src/test/fakes`), integration tests
   for the repository.

### Frontend rules

- Styles are CSS Modules that use **semantic tokens** from
  `src/styles/tokens.css` (`--color-text-secondary`), never palette values or
  raw hex.
- Server state lives in TanStack Query through the factories in
  `*.queries.ts`; mutations update the cache optimistically and invalidate
  on settle.
- `components/ui` is the design system. A new variant goes into the
  component, not into a one-off override at the call site.

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
