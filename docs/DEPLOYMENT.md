# Deployment

CashBook runs entirely in your own Cloudflare account: a Pages project (static app plus the `/api` Functions) and
one D1 database. The free plan is enough for personal and family use; check Cloudflare's current free-tier limits
for Functions requests and D1 reads/writes if you expect many users.

## One command

```bash
npm install
npx wrangler login        # once; opens a browser
npm run setup             # add -- --name my-ledger to choose the project name
```

`npm run setup` is idempotent. It:

1. Verifies you are logged in to Cloudflare.
2. Creates (or reuses) the D1 database and writes its id into `wrangler.toml`.
3. Applies `migrations/*.sql` to the remote database.
4. Creates (or reuses) the Pages project and deploys the built app.
5. Stores the sign-up policy as a Pages secret and redeploys so it takes effect.

Sign-up policy flags: default invite-only (prints an invite code), `--open-signup`, or `--close-signup`. Set
`INVITE_CODE=<value>` in the environment to keep a specific code instead of generating a new one.

Then open the printed URL, go to Settings, create your account, and add the app to your home screen.

## Manual steps (what the script does)

```bash
npx wrangler d1 create cashbook                        # copy database_id into wrangler.toml
npx wrangler d1 migrations apply cashbook --remote
npx wrangler pages project create cashbook --production-branch=main
npm run build
npx wrangler pages deploy dist --project-name=cashbook --branch=main
echo "<invite-code>" | npx wrangler pages secret put INVITE_CODE --project-name=cashbook
npx wrangler pages deploy dist --project-name=cashbook --branch=main   # secrets apply to new deployments
```

## Updating to a new version

```bash
git pull
npm install
npm run setup -- --name <your-project>
```

New migrations are applied automatically and in order. Migrations only move forward and are written to be
compatible with the previous app version, so a user who still has the old app open keeps working until the
service worker updates them.

## Managing users

```bash
npm run admin -- list-users
npm run admin -- reset-password someone@example.com
npm run admin -- revoke-sessions someone@example.com
npm run admin -- delete-user someone@example.com --yes
```

There is no email service, so password resets are done by the owner with `reset-password`, which prints a
temporary password and signs the user out everywhere.

Rotate or change who can register: `npm run setup -- --close-signup`, or re-run default setup with a new
`INVITE_CODE`. Existing accounts are unaffected.

## Backups

- Export: `npx wrangler d1 export <database-name> --remote --output backup.sql`
- D1 Time Travel can restore the database to an earlier point in time (retention depends on your plan).
- Every device also holds a full copy of its user's data in IndexedDB. Users can export each book to CSV or PDF
  from the app.

## Custom domain

Cloudflare dashboard > Workers & Pages > your project > Custom domains. HTTPS is automatic. If you change the
domain, users sign in again on the new origin (browser storage is per origin).

## Extra protection

For a private family instance, put the Pages project behind Cloudflare Access (Zero Trust) in addition to the
app's own accounts. Keep `/api` reachable for signed-in clients.

## Removing everything

Delete the Pages project and the D1 database from the Cloudflare dashboard (or `wrangler pages project delete`
and `wrangler d1 delete`). Nothing else is created.
