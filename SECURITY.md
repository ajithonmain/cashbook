# Security

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private vulnerability reporting on this
repository (Security tab > Report a vulnerability). Include what you found, steps to reproduce, and the impact.
You can expect an acknowledgement within a few days. Please give us reasonable time to fix before disclosing.

If you run your own deployment and think it was compromised, rotate secrets (`npm run setup -- --close-signup`,
then `npm run admin -- revoke-sessions <email>` for affected users) and review who has accounts
(`npm run admin -- list-users`).

## Model

CashBook is designed to be self-hosted by one owner for themselves, family, or a small team. Everyone deploys
into their own Cloudflare account, so there is no central service holding anyone else's data.

### What it protects

- Account separation: every `books` and `transactions` row carries `user_id` in its primary key, and every
  query filters by the id of the authenticated session, never by anything in the request. Verified by
  `tests/e2e/api.e2e.mjs` (user B cannot see or overwrite user A's data, even with identical record ids).
- Credentials: passwords are hashed with PBKDF2-SHA256 (100,000 iterations, per-user salt). Session tokens are
  256-bit random values; only their SHA-256 is stored, so a database leak does not yield usable tokens.
- Sessions: per device, 90-day sliding expiry, listable and revocable by the user. A password change signs out
  all other devices. Account deletion removes all data.
- Abuse: login is limited to 10 failures per email and 40 per IP per 15 minutes; registration to 10 attempts per
  IP per hour. Unknown email and wrong password are indistinguishable (same message, equalized hashing work).
- Registration is gated by an invite code (constant-time comparison), explicitly open, or closed.
- Input: strict server-side validation of types, ranges, and lengths; 512 KB body limit; 200 items per sync
  request. SQL uses bound parameters everywhere.
- Browser: `public/_headers` sets `default-src 'self'` CSP with no external hosts (fonts are bundled), plus
  `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, and a restrictive `Permissions-Policy`.
  The app loads no third-party scripts and sends no telemetry.

### What it does not protect (known limits)

- No end-to-end encryption. The server, meaning your own Cloudflare account, can read ledger contents. Anyone
  with access to that account or its D1 database can too.
- No email verification and no email password reset (there is no mail service). Resets are done by the owner
  with `npm run admin -- reset-password`. In open-signup mode anyone can register with any email address.
- The session token lives in `localStorage` on each device, so an XSS bug would expose it. The strict CSP and the
  absence of third-party code reduce that risk; do not add inline scripts or remote scripts.
- Registration reveals whether an email is already registered (`409`). Acceptable for invite-only use; prefer
  invite-only or closed signup on a public URL.
- Rate limiting is per email and per IP using the D1 database; it slows guessing but is not a replacement for a
  WAF. For a private instance, add Cloudflare Access or Cloudflare's rate limiting rules in front.
- Sync trusts client clocks for last-write-wins ordering of edits to the same record.
- A lost or stolen unlocked device has the user's local data. Use the OS screen lock; remove the device from
  Settings > Signed-in devices.

## Hardening checklist for your deployment

1. Use invite-only signup (default) and run `npm run setup -- --close-signup` once everyone has joined.
2. Use strong, unique passwords (8 characters is the minimum, not a recommendation).
3. Keep `INVITE_CODE` out of chat logs and repos; it is a Pages secret, never a file in the repo.
4. Optionally protect the whole site with Cloudflare Access.
5. Keep dependencies current (`npm audit`, Dependabot) and redeploy after updates.
6. Back up the D1 database (`docs/DEPLOYMENT.md`).
