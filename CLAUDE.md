# CLAUDE.md

Guidance for Claude Code (and people) working in this repository.

## What this is

**Alt+Shift** — a cover-letter generator. Two screens: a dashboard of saved
letters and an editor that streams a new letter from the Generation API.
The product goal is to get a job seeker to five letters.

TanStack Start (React 19, Nitro) + Clerk + Prisma/Postgres + Redis, deployed
to Railway.

## Commands

```bash
npm run dev                 # starts Postgres + Redis in Docker, migrates, http://localhost:3000
npm run lint                # Biome: format, lint, import layering
npm run typecheck
npm run db:migrate:create   # CREATE a migration from schema changes
npm run db:migrate          # create + apply locally
npm run db:down             # stop the local databases
```

Run `npm run lint` and `npm run typecheck` before reporting a change as
done. There are no automated tests.

Development runs on local Postgres and Redis from `docker-compose.yml`;
`.env.example` already points at them.

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
- CSS has no comments.
- YAML, `.gitignore` and `.env*` use the same shape with `#`.
- Prisma schema has no comments.
- Not allowed: a plain `// comment`, a trailing `code // comment`, a
  `/* block */` in TypeScript, a comment that restates the code.
- The only exceptions: `// biome-ignore <rule>: <reason>`,
  `// @ts-expect-error <reason>` and `// TODO: …`.

### Formatting and naming

- Biome: tabs, 120 columns, single quotes, no semicolons, sorted object
  keys, JSX attributes and CSS properties. `npm run lint:fix` fixes it.
- No `void` operator (`noVoid`): a fire-and-forget promise is just called.
- `*.server.ts` is server-only and must never be imported, directly, by a
  file that reaches the client bundle. Server functions (`*.api.ts`) and
  middleware files drop the suffix because the client imports them; they
  reach services only through `context.scope.cradle`.
- Route-private files are prefixed with `-` (`-sign-in.module.css`) so the
  router ignores them.
- Services, repositories and gateways are factories `createXxx({ deps })`
  returning a plain object, typed as `ReturnType<typeof createXxx>`. No
  classes except errors.
- No barrel files in `domain/`, `features/` or `screens/`: import the module itself
  (`@/features/billing/hooks/use-entitlements`). A barrel there mixes
  server functions, hooks and styled UI, and importing one name drags in
  the rest — it once put the whole landing into every page's entry chunk.
  Each component folder in `components/` has a one-line `index.ts`
  (`export * from './button'`) and nothing else does.
- Files and folders are kebab-case (Biome `useFilenamingConvention`, routes
  aside); components are one per file.
- A component's props are a named type declared above it —
  `type ButtonProps = { … }`, or `type InputProps = ComponentProps<'input'>`
  — never an inline `({ children }: { children: ReactNode })`.
- Imports inside one domain, one feature, one backend module, one screen
  or one `lib/` group are relative (`./application-tone`); anything outside
  it goes through `@/`.

## Architecture

```
src/domain/<x>/     pure code shared by server and browser, one domain
                    each (applications, billing, generation): zod
                    schemas, types, constants, pure logic. No React, no
                    Node, no I/O
src/backend/        everything that runs only on the server
                      modules/<x>/  a domain's server side: repository,
                                    service, mapper, its DI module
                                    (applications, billing, generation,
                                    account — the Clerk webhook events)
                      the rest      infrastructure — config, auth, errors,
                                    DI, middleware, http, database, Redis,
                                    rate limiting, gateways, lifecycle
src/routes/         thin route files: URL, guards and head() → a screen.
                    `/` landing, `/sign-in`, and the signed-in workspace
                    under `/app` (app/route.tsx is its guard and shell):
                    /app/applications, …/create, …/$applicationId and
                    /app/billing beside them.
src/screens/<x>/    one page each (landing, auth, workspace, dashboard,
                    application, billing): composes features, owns the
                    page-only UI
src/features/<x>/   how the browser works with a domain (applications,
                    billing, generation, marketing), in segments:
                      api/    server functions, query keys/factories, cache
                      hooks/  client hooks
                      ui/     the domain's reusable components
src/components/     design system (ui/), layout, brand, fallbacks,
                    clerk-boundary (with Clerk's appearance) — know
                    nothing of domains or features
src/hooks/          generic React hooks
src/lib/            infrastructure safe on both sides, one folder per
                    concern and nothing loose at its root:
                      api/       the error contract with our server
                      document/  brand and page titles, <head>, page
                                 transitions
                      query/     the per-user query client, persisted
                      text/      pure string helpers
                    A module with a single consumer lives beside it
                    instead (Clerk config in clerk-boundary/, the
                    breakpoints in styles/ next to tokens.css)
```

Where a file goes: runs only on the server → `backend/`; pure and needed
by both sides → `domain/`; React or browser data access → `features/`.

Imports flow one way, and Biome's `noRestrictedImports` (one `overrides`
entry per layer in `biome.json`) fails any import against it. Inside
`features/` and `screens/` every `@/features/…` or `@/screens/…` import is
refused: a module's own files are imported relatively, so an absolute one
can only reach another feature or screen.

```
routes → screens → features → domain · components · hooks · lib
backend → domain · lib
```

A feature reaches the backend only through its server functions'
middleware (`@/backend/middleware/*`); screens and shared code never
import the backend, and `domain/` imports nothing but `lib/`.
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
  `userActor` exists only on user scopes; system code (webhooks) runs
  on a system scope and cannot resolve user services.
- **Errors are `AppError`s with a code from `src/lib/api/api-error.ts`.** Adding
  a code means adding its sentence in `src/lib/api/api-error-message.ts`; the
  compiler enforces it. Nothing from an exception other than the payload may
  reach a client.
- **Every user-facing server function uses `userScopeMiddleware`; every
  cookie-authenticated `/api` route uses `userApiScopeMiddleware`** (it adds
  the CSRF check). Webhooks use `systemApiScopeMiddleware` and
  authenticate by signature.
- **Configuration is parsed once at boot** in `config.server.ts`. A new
  environment variable is added to its schema and to `.env.example` in the
  same change. Product limits are code in the config, not env.
- **Anything that costs money or a shared budget is rate limited** through
  a constructor in `rate-limit/budgets.ts` (key, limit and window in one
  place) — never a hand-built key, so the code that charges a budget and
  the code that reports it hit the same counter.
- **Server function inputs go through `validateInput(schema)`**
  (`backend/middleware/validate-input.ts`), never the bare schema: TanStack
  reports a bare schema's failure as a plain `Error`, which surfaces as
  `internal` instead of `invalid_request`.
- **Features own what an event means; the backend only transports it.** A
  Clerk event is handled in `backend/modules/account`
  (`account-events.service.server.ts`) after `clerkWebhookVerifier` proves
  it.

### Adding a server feature

1. Model in `prisma/schema.prisma`, then `npm run db:migrate:create`.
2. `domain/x/x.schema.ts` — the zod schemas and types both sides share.
3. `backend/modules/x/x.repository.server.ts` — Prisma only, owner-scoped.
4. `backend/modules/x/x.service.server.ts` — rules, errors, logging.
5. Register both in `backend/modules/x/x.module.server.ts` (`.scoped()`)
   and add the module to `src/backend/di/container.server.ts`.
6. `features/x/api/x.api.ts` — `createServerFn` + `userScopeMiddleware` +
   `.validator(validateInput(schema))` + one service call.
7. `features/x/api/x.queries.ts` — key and query factories for the client.

### Frontend rules

- Styles are CSS Modules:
  - each module is one `@layer` block named after its folder (`ui`,
    `components`, `features`, `screens`), so a `className` passed down
    always beats the component's own rules;
  - `.root` is the component's outer element, parts are camelCase roles,
    and TSX maps variants explicitly (`TONE_CLASS[tone]`), never
    `styles[tone]`; every class is read and every `styles.x` exists;
  - values come from `src/styles/tokens.css`: colour roles, never palette
    or literals; `font: var(--type-body-sm)` for text; `--space-*`;
    `--icon-size` for Lucide icons;
  - nesting for states, context and media queries; media queries only
    `(width < x)` / `(width >= x)` with x in 30/40/48/60/64rem.
- Server state lives in TanStack Query through the factories in
  `api/*.queries.ts`; mutations update the cache optimistically (helpers in
  `api/*.cache.ts`) and invalidate on settle.
- A route file holds only its URL concerns — params, search, guards,
  `head()`, `ssr` — and renders a screen from `src/screens`.
- Screens are named `<name>-screen.tsx` and export `<Name>Screen`.
- Inside a screen every component has its own folder: the component, its
  CSS module and the hooks or helpers only it uses
  (`plan-card/plan-card.tsx` + `plan-card.module.css`). The screen file and
  what several components share stay at the screen's root; a skeleton
  lives with the component it mirrors. A component never styles through
  another one's module: it takes a prop (`SectionHeading onInk`).
- `components/ui` is the design system. A new variant goes into the
  component, not into a one-off override at the call site.
- Dialogs are react-call callables, as in our other projects: define one
  with `createCallable` on top of `components/ui/dialog` (a native modal
  `<dialog>`), add its `.Root` to `components/dialogs/dialog-roots`, and
  `await XDialog.call({…})` wherever it is needed. No open/close state in
  the caller.
- Forms are TanStack Form, as in our other projects: `useAppForm` /
  `withForm` from `components/form`, one zod schema from `domain/` as both
  `onMount` and `onChange` validator (so submit starts disabled), and
  `onSubmit` parses the values with that schema before using them. Fields
  are `form.AppField` + a field component (`TextField`, `TextAreaField`,
  `SegmentedField`); a new kind of control becomes a field component there,
  not local state. The hook that builds a form lives beside it
  (`use-application-form.ts`), the markup is a `withForm` component.

### Copy

- The interface is English only. Text is written where it is shown, in
  the component, with no message catalogue or translation layer.

## Commits

Small, conventional (`feat(scope):`, `fix:`, `refactor:`,
`docs:`, `chore:`), each one a single reviewable step with a body that says
why. Never commit `.env` or anything under `src/generated`.
