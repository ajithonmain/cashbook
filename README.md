# CashBook

A fast, private, offline-first ledger you install like a native app. Track cash in and cash out across
multiple books, search and filter, and export to PDF or Excel (CSV). Everyone gets their own account, and
their books sync across all their devices. You host it yourself on Cloudflare, so the data lives in your own
account. No central server, no tracking, no third-party scripts.

- Multiple books (Personal, Shop, Trip, ...) with live Net Balance, Total In and Total Out
- Cash In / Cash Out sheet: amount, category, party, payment mode, remarks, date and time
- Search by category or party; filter by type, category, party, payment mode (in a filter sheet)
- Swipe an entry to delete, with undo
- Export the current book as PDF or CSV
- **Separate accounts**: each user sees only their own books
- **Multi-device sync**: sign in on your phone, tablet and laptop; changes appear everywhere
- **Offline first**: everything is saved on the device first, then syncs in the background when online
- Works without an account too (data stays on the device until you sign in)
- Installable PWA with a compact, header-less mobile UI, slim bottom dock, and Light / Dark / System themes
- Per-book icon and color (distinct by default, editable) so books are easy to tell apart
- Install, check for updates, and protect your data from Settings

Stack: React, Vite, Tailwind, IndexedDB (`idb`), Cloudflare Pages + Functions + D1. TypeScript strict.

## Deploy your own (about 3 minutes)

You need a free Cloudflare account and Node 18+.

```bash
git clone https://github.com/ajithonmain/cashbook.git
cd cashbook
npm install
npx wrangler login      # opens your browser once
npm run setup           # creates the database, builds, deploys
```

The script prints your URL (`https://<name>.pages.dev`) and an invite code. Open the URL on your phone, go to
Settings > Create an account, enter the invite code, then add the app to your home screen.

Who can sign up:

| Mode | Command | Behavior |
| --- | --- | --- |
| Invite-only (default) | `npm run setup` | Registering needs the invite code. Share it with family or team. |
| Open | `npm run setup -- --open-signup` | Anyone with the URL can create an account. |
| Closed | `npm run setup -- --close-signup` | No new accounts. Existing users keep working. |

Pick the project name with `--name my-ledger`. Re-running `npm run setup` is safe; it updates in place.

### Let your AI agent do it

Open the repo in Claude Code, Codex, Cursor, or any coding agent and say:

> Read AGENTS.md and deploy this app to my Cloudflare account.

The only thing you do yourself is the one-time `npx wrangler login`. See [AGENTS.md](AGENTS.md).

## Develop

```bash
npm install
npm run dev          # offline app at http://localhost:5173, no backend needed
npm test             # unit tests
```

To run the full stack locally (accounts and sync) see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Documentation

| Doc | What it covers |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Instructions and invariants for AI agents (also useful for humans) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data model, offline storage, sync algorithm, accounts |
| [docs/API.md](docs/API.md) | HTTP API reference |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying, updating, backups, custom domain, rotating secrets |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Running locally, tests, project layout |
| [docs/DESIGN.md](docs/DESIGN.md) | Design system and UX principles |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Fixes for common problems |
| [SECURITY.md](SECURITY.md) | Security model and how to report a vulnerability |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [CHANGELOG.md](CHANGELOG.md) | Release notes |

## Owner tools

```bash
npm run admin -- list-users
npm run admin -- reset-password someone@example.com    # prints a temporary password
npm run admin -- revoke-sessions someone@example.com   # sign them out everywhere
npm run admin -- delete-user someone@example.com --yes
```

There is no email service, so there is no "forgot password" email. The owner resets passwords with the command
above. Users can change their own password, see and remove signed-in devices, and delete their account from
Settings.

## How sync works (short version)

Every change is written to the device first, so the app is instant and works offline. Each write also goes into
a queue. When you are online and signed in, the queue uploads in batches and new changes from your other
devices download. If two devices edit the same entry, the most recent edit wins. Details in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security at a glance

- Passwords are hashed with PBKDF2-SHA256; sessions are random tokens stored hashed; each device can be removed.
- Every query is scoped to the signed-in user; accounts cannot read each other's data.
- Login and registration are rate limited. Strict Content Security Policy; no external requests.
- Your data is not end-to-end encrypted: the server (your own Cloudflare account) can read it.

Full model and limits in [SECURITY.md](SECURITY.md).

## Roadmap

Ideas that are not built yet: sharing a book with another account, recurring entries, budgets and charts,
receipt photos, multi-currency, import from CSV, passkeys. Contributions welcome.

## License

MIT, see [LICENSE](LICENSE).
