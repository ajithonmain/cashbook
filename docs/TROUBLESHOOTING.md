# Troubleshooting

## Deploying

**"Not logged in to Cloudflare"**: run `npx wrangler login`, finish in the browser, then `npm run setup` again.

**`d1 create` fails because the name exists**: the script reuses an existing database with that name. If you
want a separate one, pass `--db <other-name>`.

**Project name already taken or invalid**: Pages project names are lowercase letters, digits and dashes. Use
`--name my-unique-name`.

**Deploy works but the app says "Sync is not available"**: the `/api` Functions or the D1 binding are missing.
Check `wrangler.toml` has your real `database_id` (not the placeholder), that migrations applied
(`npx wrangler d1 execute <db> --remote --command "SELECT name FROM sqlite_master"`), and that the deployment
includes the `functions/` folder (deploy from the repo root).

**Sign-up says "Registration is closed"**: no invite code or open-signup is configured. Run
`npm run setup` (invite-only) or `npm run setup -- --open-signup`.

**Sign-up says "Invalid invite code"**: use the exact code printed by setup. Re-running setup without
`INVITE_CODE` set generates a new code and invalidates the old one.

**Changes do not appear after a redeploy**: the service worker serves the previous build once. Close and reopen
the app, or reload twice.

## Accounts and sync

**"Session ended. Sign in again"**: the session expired (90 days idle), was removed from another device, or the
password changed. Your local data is kept; sign in with the same account and sync resumes.

**"Too many failed attempts"**: login is limited to 10 failures per email and 40 per IP per 15 minutes. Wait,
or ask the owner to run `npm run admin -- reset-password <email>`.

**Forgot password**: there is no email reset. The owner runs `npm run admin -- reset-password <email>` and gives
the user the temporary password.

**Changes made on one device do not show on another**: both devices must be signed in to the same account.
Open Settings on each: status should say "Up to date". Pull to a fresh state by signing out (this clears that
device's local copy only) and signing in again. Unsynced changes block a silent sign-out; the app warns you.

**Pending count never reaches zero while online**: Settings shows the last error. A 400 means the server
rejected a record (for example an amount over the limit); fix or delete that entry. A 401 means sign in again.

**Data on a phone but not on the server**: you were signed out when you entered it. Signing in imports
signed-out data into the account automatically.

## Local development

**`pages dev` registers fine but every request returns 500 with "no such table"**: you passed `--d1` or did
not apply local migrations. Run `npm run db:migrate:local` and start `npx wrangler pages dev dist` without
`--d1`.

**`workerd` or `esbuild` binary missing after `npm install`**: npm 11 blocks install scripts. They are
allow-listed in `package.json` (`allowScripts`); run `npm approve-scripts <package>` if one is missing.

**`npm install` fails with ERESOLVE about vite and vitest**: keep Vitest on 2.x while Vite is 5.x.

**Install prompt does not appear**: the app must be served over HTTPS (or localhost), have a valid manifest and
registered service worker. On iOS there is no prompt; use Share > Add to Home Screen.

**Toast hides behind the bottom bar or a layout loses its padding**: `.safe-bottom` and `.safe-top` in
`index.css` are unlayered and override Tailwind `pb-*` / `pt-*` on the same element. Use one or the other.
