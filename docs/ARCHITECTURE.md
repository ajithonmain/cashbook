# Architecture

CashBook is a local-first app. The browser is the primary database; the server is a per-user sync and
backup target.

```
 Device A (phone)                         Cloudflare (your account)               Device B (laptop)
┌──────────────────┐   POST /sync/push   ┌──────────────────────────┐            ┌──────────────────┐
│ React UI         │ ─────────────────▶  │ Pages Functions (/api)   │            │ React UI         │
│  │ read/write    │                     │  auth middleware         │            │  │ read/write    │
│  ▼               │   GET /sync/pull    │  validate + rate limit   │  GET pull  │  ▼               │
│ IndexedDB        │ ◀─────────────────  │            │             │ ◀───────── │ IndexedDB        │
│ cashbook-<uid>   │                     │            ▼             │            │ cashbook-<uid>   │
│ + sync queue     │                     │ D1 (SQLite)              │            │ + sync queue     │
└──────────────────┘                     └──────────────────────────┘            └──────────────────┘
```

## Client

### Local database and scopes

`src/lib/db.ts` wraps IndexedDB (`idb`). Object stores: `books`, `transactions`, `syncQueue`, `meta`.

Each signed-in account gets its own database named `cashbook-<userId>`. Signed-out use is the `local` scope
(database `cashbook`). `App.tsx` calls `setScope()` during render from the auth state, before any child reads
data, and re-keys the screens by scope so nothing from the previous account stays mounted.

Consequences:
- Two accounts on one browser never see each other's data.
- Signing out deletes that account's local database (the server still has the data). If changes are still
  waiting to upload, the app warns first.
- Signing in with signed-out data on the device imports it into the account (`account.ts` `adopt`), queues it
  for upload, then deletes the local database. Nothing is lost.

### Writes and the sync queue

Every mutation in `db.ts` writes the record and appends an item to `syncQueue`, then fires a
`cashbook:queued` event. `sync.ts` debounces that event (800 ms) into a sync run. Deletes are soft
(`deleted: true`) so they can propagate; deleting a book soft-deletes its entries.

### Sync engine (`src/lib/sync.ts`)

A run does three things, guarded so only one runs at a time (a request during a run schedules one more):

1. Coalesce the queue (`queue.ts`): keep only the newest queued write per record, drop superseded ones.
2. Push in chunks of 100 to `POST /api/sync/push`. A chunk's queue items are removed only after the server
   acknowledges it, so a failure retries the same chunk.
3. Pull pages from `GET /api/sync/pull?since=<cursor>` until `hasMore` is false, upserting records whose
   `updatedAt` is newer than the local copy, and store the returned cursor in the `meta` store.

Triggers: a local write, the browser coming online, the tab becoming visible, and a 60-second interval.
Status (`local | idle | syncing | offline | error | expired`) is exposed through `useSyncState()`; when pulls
change local data, `useDataVersion()` increments and screens re-read IndexedDB.

### Auth state

`src/lib/auth.ts` keeps `{ token, user, expired }` in `localStorage`. A 401 from any authenticated call sets
`expired`: sync pauses, local data stays, and Settings asks the user to sign in again (the form is prefilled).
Signing in as a different user opens that user's separate database.

## Server

Cloudflare Pages Functions under `functions/api/`, sharing code from `server/lib/`.

- `functions/api/_middleware.ts` authenticates every request except `/api/health`, `/api/auth/login` and
  `/api/auth/register`, and attaches `data.user`. It lives under `functions/api/` (not the functions root) so
  static assets never invoke a Function.
- Handlers are wrapped in `guard()`, which turns `HttpError` into a JSON error and any other exception into a
  generic 500 without leaking details.

### Data model (D1)

See `migrations/0001_init.sql`.

| Table | Purpose |
| --- | --- |
| `users` | `id`, unique `email`, `password_hash` |
| `sessions` | one row per signed-in device; stores `SHA-256(token)`, device name, last seen, expiry (90 days, sliding) |
| `auth_attempts` | recent failed logins and registrations for rate limiting |
| `books` | PK `(user_id, id)`; `name`, `created_at`, `updated_at`, `deleted`, `synced_at` |
| `transactions` | PK `(user_id, id)`; amount, type, category, party, payment mode, remarks, timestamps, `deleted`, `synced_at` |

Ids are UUIDs generated on the client (so records can be created offline). Because the primary key includes
`user_id`, an id collision between two users is impossible to exploit: they are different rows.

### Conflict resolution and the pull cursor

Two clocks are used on purpose:

- `updated_at` is the client clock. Last write wins, enforced atomically in SQL:
  `ON CONFLICT(user_id, id) DO UPDATE ... WHERE excluded.updated_at > <table>.updated_at`. A stale offline
  edit can never overwrite a newer one, even with concurrent pushes.
- `synced_at` is the server clock at the moment the row was written. Pull pages are ordered and cursored by
  it. If pulls were cursored by `updated_at`, a device that was offline for a week and then pushes an old edit
  would create a row other devices never fetch, because their cursor is already past it.

Pull returns up to 500 rows per table with `synced_at >= since` (`>=` so rows written in the same millisecond
as the previous page's last row are not skipped; clients upsert idempotently). If a table fills a page, the
returned cursor stops at that table's last row; otherwise it is the newest row seen.

Known limits: last-write-wins means two devices editing the same entry offline keep only the later edit, and
client clocks are trusted for ordering (large clock skew can make an older edit win). Both are acceptable for a
personal ledger; per-field merging or hybrid logical clocks would be the upgrade path.

### Accounts and sessions

- Passwords: PBKDF2-SHA256, 100,000 iterations (the Workers maximum), random 16-byte salt, stored as
  `pbkdf2-sha256$<iterations>$<salt>$<hash>` so the cost can be raised later.
- Sessions: a random 256-bit bearer token is returned once; only its SHA-256 is stored. Each device has its own
  session, listable and revocable. Changing the password signs out all other devices.
- Registration policy comes from Pages secrets: `ALLOW_SIGNUP=true` (open), or `INVITE_CODE` (invite-only), or
  neither (closed). The invite code is compared in constant time.
- Rate limits (D1-backed): 10 failed logins per email and 40 per IP per 15 minutes; 10 registration attempts
  per IP per hour.

## PWA and offline

`vite-plugin-pwa` precaches the app shell so the app opens offline. `/api` requests are never cached or
replayed by the service worker (`navigateFallbackDenylist`); retries are the sync engine's job. The font is
bundled (`@fontsource-variable`), so the app renders identically offline and makes no external requests, which
lets `public/_headers` set `default-src 'self'`.

## Why these choices

- IndexedDB first: instant UI, works on a plane, the server is optional.
- D1 + Pages Functions: free tier is enough for personal use, one deployable unit, no servers to run.
- Server-side validation and SQL-level LWW: the client is untrusted and offline clients make races normal.
- Per-user database scopes on the client: simplest way to guarantee account separation on a shared browser.
