# CashBook

A fast, private, offline-first ledger you install like a native app. Track cash in and cash out across multiple
books, search and filter entries, and export to PDF or Excel (CSV). Your data lives on your device and
optionally syncs to a database in your own Cloudflare account. No third-party backend, no tracking.

- Multiple books (Personal, Shop, Trip, ...) with live Net Balance, Total In, Total Out
- Cash In / Cash Out sheet: amount, category, party, payment mode, remarks, date and time
- Search by category or party, filter by type, category, party, payment mode
- Swipe an entry to delete, with undo
- Export the current book as PDF or CSV
- Installable PWA, works fully offline, syncs in the background when you are back online
- Dark, mobile-first UI with bottom navigation

Stack: React, Vite, Tailwind, IndexedDB (`idb`), Cloudflare Pages + Functions + D1.

## Deploy your own (2 minutes)

You need a free Cloudflare account and Node 18+.

```bash
git clone <this-repo-url> cashbook
cd cashbook
npm install
npx wrangler login      # opens your browser once
npm run setup           # creates D1, builds, deploys, sets a sync token
```

The script prints your live URL (`https://<name>.pages.dev`) and a sync token. Open the URL on your phone,
add it to the home screen, then paste the token under Settings > Sync token.

Options: `npm run setup -- --name my-ledger` to pick the project name, `--no-sync` to skip the database
and token and run purely on-device.

### Let your AI agent do it

Open the repo in Claude Code, Codex, Cursor, or any coding agent and say:

> Read AGENTS.md and deploy this app to my Cloudflare account.

[AGENTS.md](AGENTS.md) has the exact steps. The only thing you do yourself is the one-time `wrangler login`.

## Develop locally

```bash
npm install
npm run dev
```

The app works completely offline in dev. To test sync locally, run `npm run d1:init` and
`npx wrangler pages dev dist` after a build, with `CASHBOOK_TOKEN` set in a `.dev.vars` file.

## How it works

- Every change is written to IndexedDB first, so the UI is instant and works offline.
- Each write also lands in a sync queue. When online and a token is set, the queue is pushed to
  `/api/sync/push` and remote changes are pulled from `/api/sync/pull`.
- Conflicts resolve by last write wins on `updatedAt`. Deletes are soft so they propagate.
- `functions/_middleware.ts` rejects any `/api` request without `Authorization: Bearer <CASHBOOK_TOKEN>`.

## Security notes

- Single-user by design. Anyone with the sync token can read and write your ledger, so treat it like a password.
- The token is stored in the browser's `localStorage` on your devices.
- To rotate it: `CASHBOOK_TOKEN=<new> npm run setup -- --name <project>`, then update each device.
- For stronger protection, put the Pages project behind Cloudflare Access.

## Customize

- Categories and payment modes: `src/lib/types.ts`
- Colors and theme: CSS variables in `src/index.css`
- App icons: replace `public/icons/icon-192.png` and `icon-512.png`

## License

MIT, see [LICENSE](LICENSE).
