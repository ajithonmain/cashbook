# Development

## Setup

Node 18+ (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run dev` serves the client only. It runs fully offline with signed-out (local) data, and Settings shows
"Sync is not available" because there is no `/api`. That is enough for most UI work.

## Run the full stack locally (accounts and sync)

```bash
cp .dev.vars.example .dev.vars          # sets INVITE_CODE for local registration
npm run build
npm run db:migrate:local                # creates the local D1 database from migrations/
npx wrangler pages dev dist --port 8788 # app + /api at http://localhost:8788
```

Notes:
- Do not pass `--d1` to `pages dev`; the binding is read from `wrangler.toml`. Passing it creates a separate empty
  database that has none of your migrations.
- The local database lives in `.wrangler/state/` (gitignored). Delete that folder to start fresh.
- After rebuilding, reload the page twice: the service worker serves the previous build once.
- `pages dev` serves `dist/`, so rebuild (`npm run build`) after client changes. For fast client iteration use
  `npm run dev` and point it at the local API only if you need to (not set up by default).

## Tests

| Command | What |
| --- | --- |
| `npm run typecheck` | client type check |
| `npx tsc -p functions/tsconfig.json` | server type check (`functions/` and `server/`) |
| `npm test` | vitest unit tests: crypto, validation, queue coalescing |
| `npm run test:e2e` | 36 API checks against the running local server on port 8788 |

`test:e2e` registers throwaway users. Only run it against the local database or another disposable one. Use
`BASE_URL` and `INVITE_CODE` environment variables to target a different server.

## Project layout

```
src/                client (see docs/ARCHITECTURE.md)
functions/api/      one file per endpoint; _middleware.ts authenticates /api/*
server/lib/         shared server code (crypto, validate, auth, ratelimit, http)
migrations/         numbered D1 migrations
scripts/            setup.mjs (deploy), admin.mjs (owner tools)
tests/              unit tests; tests/e2e/ API test
public/             icons and _headers (security headers and CSP)
docs/               documentation
```

## Adding a migration

Create `migrations/000N_description.sql`. Never edit one that has been applied. Apply locally with
`npm run db:migrate:local`; `npm run setup` applies it remotely. Make changes additive (new nullable or
defaulted columns) so the previous client version keeps working while users update.

## Debugging tips

- Inspect local data: DevTools > Application > IndexedDB > `cashbook` or `cashbook-<userId>`.
- Inspect the server DB: `npx wrangler d1 execute cashbook --local --command "SELECT * FROM users"`.
- Sync stuck? Settings shows status and pending count. A 401 means the session ended; sign in again.
- Server errors are logged by `pages dev` in the terminal running it.

## Releasing

Update `CHANGELOG.md`, bump the version in `package.json`, tag, and publish a GitHub release. Deployers update
with `git pull && npm run setup`.
