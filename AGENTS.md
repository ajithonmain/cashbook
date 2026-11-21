# Instructions for AI coding agents

This repo is CashBook, a self-hosted offline-first ledger PWA (React + Vite, IndexedDB on device, optional
sync through Cloudflare Pages Functions + D1). A human cloned it and wants you to deploy it to THEIR Cloudflare
account. Follow this file exactly.

## Deploy to the user's Cloudflare account

1. Check prerequisites: Node 18+ and npm (`node -v`). Run `npm install`.
2. Cloudflare login is a human step (opens a browser). Check with `npx wrangler whoami`.
   If not logged in, ask the user to run `npx wrangler login` themselves, then continue. Never ask for or
   handle their Cloudflare password or API tokens in chat.
3. Ask the user (once) for a project name, default `cashbook`, and whether they want multi-device sync.
4. Run `npm run setup -- --name <project>` (add `--no-sync` if they do not want sync). The script:
   - creates or reuses the D1 database and writes its id into `wrangler.toml`
   - applies `schema.sql` to the remote database
   - creates the Pages project, builds, and deploys to `<project>.pages.dev`
   - generates a random `CASHBOOK_TOKEN`, stores it as a Pages secret, and redeploys
5. Report the live URL and the sync token from the script output. Tell the user to store the token in a
   password manager and paste it into Settings > Sync token on each device. Do not write the token to any
   file in the repo or commit it.
6. Tell the user how to install: open the URL on their phone, then "Add to Home Screen" (iOS Safari) or
   the install prompt (Android Chrome).

If a step fails, read the wrangler error, fix the cause, and re-run `npm run setup`; it is idempotent
(it reuses the existing D1 database and Pages project).

## Rules for working in this repo

- TypeScript strict. Verify changes with `npm run typecheck` and `npm run build`.
- Local data lives in IndexedDB (`src/lib/db.ts`); every write also enqueues a sync item. Keep that invariant.
- Sync is last-write-wins by `updatedAt`. Deletes are soft (`deleted: true`).
- The API is protected by `functions/_middleware.ts` (Bearer `CASHBOOK_TOKEN`). Do not weaken it or add
  unauthenticated routes.
- UI: dark theme via CSS variables in `src/index.css`; icons are inline SVG only; mobile-first, 44px touch
  targets, respect `prefers-reduced-motion`. No emojis in code or comments.
- Never commit secrets, `.wrangler/`, or a real `database_id` belonging to someone else.

## Local development

```bash
npm install
npm run dev        # fully offline app on http://localhost:5173
```
