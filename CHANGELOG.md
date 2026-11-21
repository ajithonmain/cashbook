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
- Unit tests (crypto, validation, queue, book styling) and a 40-check API end-to-end test.
- Documentation set: AGENTS.md, CLAUDE.md, architecture, API, deployment, development, design, troubleshooting,
  security policy, contributing guide, code of conduct, issue and PR templates, CI workflow.

- Light, Dark and System themes with a switch in Settings; the saved theme applies before first paint.
- Book icons (32) and colors: each book gets a distinct color derived from its name and an icon suggested from keywords, both editable in a picker. Synced; migration `0002_book_style.sql`.
- Settings: Install app (native prompt, or Add to Home Screen steps on iOS), Version with Check for updates, in-app update banner and Update now, Device storage with Protect my data.
- Android and browser Back return from a book to the list.

### Changed

- Smooth motion everywhere: tabs stay mounted and cross-fade (no reload, no flicker, scroll kept), books push in as a layer with Android and browser Back support, a sliding dock indicator, enter and exit animations for sheets, dialogs, menus and toasts, theme cross-fade, and instant paint from cached entries.
- Book Auto color now avoids colors already used by other books (minimum 28 degrees apart) and is stored; legacy books get distinct colors once. 18 color presets plus a custom hue slider.
- Icon set expanded to 32 and the wallet, store, car and coins icons redrawn.
- Dropdown menus render in a portal, so the last list item's menu is no longer cut off.
- Redesigned UI in the PocketDays visual language: neutral monochrome palette, hairline borders, flat panels, slim bottom dock with an inverted active pill.
- Removed all page headers; every tab starts with a balance summary. Settings is a compact grouped list.
- Much denser layout: two-line entry rows, smaller controls and type throughout.
- Filters moved into a sheet with removable chips; bottom sheets render in a portal above the dock.
- Service worker updates are user-controlled (prompt) instead of automatic.
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
