# Changelog

All notable changes are documented here. Format based on Keep a Changelog; versions follow semver.

## [Unreleased]

### Added
- Separate user accounts (email and password) with invite-only, open, or closed sign-up.
- Multi-device sync: books and entries follow each account across devices; background push and paginated pull.
- Per-device sessions with a signed-in devices list, remote sign-out, password change, and account deletion.
- Signed-out data is imported into the account on first sign-in, so nothing is lost.
- Sync status badge and details in Settings; "session ended" recovery that keeps local data.
- Owner tools: `npm run admin` (list users, reset password, revoke sessions, delete user).
- Login and registration rate limiting; strict server-side validation of all synced data.
- Unit tests (crypto, validation, queue) and a 36-check API end-to-end test.
- Documentation set: AGENTS.md, CLAUDE.md, architecture, API, deployment, development, design, troubleshooting,
  security policy, contributing guide, code of conduct, issue and PR templates, CI workflow.

### Changed
- Pull cursor now uses the server clock (`synced_at`) so edits made offline for a long time still reach other
  devices.
- Deleting a book also soft-deletes its entries so other devices stay consistent.
- Adding an entry now also syncs the book's updated timestamp.
- Fonts are bundled instead of loaded from Google Fonts; Content Security Policy is `default-src 'self'`.
- Filled buttons use dark text to meet WCAG AA contrast.
- Export code (PDF, CSV) is loaded on demand.
- Database setup uses numbered migrations instead of a single schema file.

### Removed
- The single shared sync token; replaced by per-user accounts.

## [0.1.0]

### Added
- Offline-first ledger PWA: multiple books, Cash In / Cash Out entries, search and filters, PDF and CSV export,
  dark mobile-first UI with bottom navigation, installable.
- Optional sync to Cloudflare Pages Functions and D1 with a shared token.
- One-command Cloudflare deploy script and agent deployment guide.
