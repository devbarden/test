# Alt+Shift

Live: **[test-production-0cb1.up.railway.app](https://test-production-0cb1.up.railway.app)**

A cover-letter generator. The brief asked for two screens: a dashboard of saved letters and an editor that streams a new letter from the Generation API. The product goal is to get a job seeker to five letters.

I went well beyond the two screens. The app has real authentication and authorization, letters stored in Postgres per user, Redis for rate limits and locks, a Free and a Pro plan with checkout, a landing page, and a production deploy. The two screens from the brief are the core; everything else is what a product needs around them.

TanStack Start (React 19, Nitro) + Clerk + Prisma/Postgres + Redis, deployed to Railway.

## Documentation

| Document | What it answers |
| --- | --- |
| [Architecture](docs/architecture.md) | how the client, server and shared code fit, the request path, DI, errors, budgets |
| [Project structure](docs/project-structure.md) | what every folder in `src/` is for, how the tree works, where a new file goes |
| [Stack](docs/stack.md) | every library and service, and why it was chosen |
| [Generation API](docs/generation-api.md) | the streaming proxy: SSE to NDJSON, retries, timeouts, refunds, prompt safety |
| [Billing](docs/billing.md) | plans, entitlements from Clerk, where limits are enforced, checkout |
| [Storage](docs/storage.md) | the Postgres table, ownership, soft delete, the per-user browser snapshot |
| [Design system](docs/design-system.md) | tokens, cascade layers, the kit, patterns from the mockups |
| [Deployment](docs/deployment.md) | Railway, environment, migrations, graceful shutdown |
| [Product decisions](docs/product-decisions.md) | choices beyond the mockups, edge cases, what the mockups got wrong |

## Run it

```bash
cp .env.example .env    # add the Clerk keys and the Generation API token
npm install
npm run dev             # starts Postgres and Redis in Docker, applies migrations, http://localhost:3000
```

Needs Node 24+ and Docker. The local database addresses are already in `.env.example`. The Generation API token is read only by the server and never reaches the client bundle.

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build && npm start` | production build and start, the same as Railway |
| `npm run lint` / `npm run lint:fix` | Biome: format, lint, import layering |
| `npm run typecheck` | TypeScript |
| `npm run db:migrate` | create and apply a migration locally |
| `npm run db:down` | stop the local databases |

## How I worked

**Tools.** Claude Design for the UI pass from the mockups. Claude Code for the code, with my own skills, rules and MCP servers for the services the project uses, such as Railway and the documentation of the libraries in the stack.

**Nothing of that workflow is in this repository.** Skills, rules and MCP configuration live in my global setup on my laptop, so they travel with me, not with the repo.

**Where it helped.** The agent picked up the conventions from my neighbouring projects (TanStack Start, Clerk, Biome, the comment style) and carried them here. Before writing the client it probed the live Generation API with direct requests, which found every deviation from the spec listed in [generation-api.md](docs/generation-api.md#where-the-live-api-differs-from-its-spec).

**Where I disagreed.** Not much at the architecture level: the structure, the layering and the backend conventions were settled before this project, so there was little to argue about there. The disagreements were local and small. One about process is worth a line: a refactor commit came out unbuildable, with a file moved in one commit and its imports in the next. The history was rebuilt so that every commit passes typecheck.

**What is most mine.** The shape of `src/` and everything under `src/server`: the client/server split, the layers and the Biome rules that enforce them, DI with request scopes, owner-scoped repositories, the error contract, the budgets. All of it was worked out and checked by hand before this project and brought here as a starting point.
