# Contributing

Thanks for helping. CashBook is small on purpose: offline-first, private, easy to self-host.

## Before you start

- Read [AGENTS.md](AGENTS.md). It lists the invariants (data, sync, security) that every change must keep. It is
  written for AI agents but is the best human summary too.
- For anything bigger than a bug fix, open an issue first so we can agree on the approach.
- Security issues: see [SECURITY.md](SECURITY.md); do not file them publicly.

## Set up

```bash
git clone <your-fork-url>
cd cashbook
npm install
npm run dev
```

Full-stack local setup (accounts and sync): [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Making a change

1. Branch from `main`.
2. Keep the change focused. Do not mix refactors with features.
3. Follow the conventions in AGENTS.md: TypeScript strict, no emojis, inline SVG icons, design tokens not raw
   hex, accessible labels, 44px touch targets, dark mobile-first UI.
4. Add or update tests. Pure logic gets a unit test in `tests/`. Sync or API behavior gets a check in
   `tests/e2e/api.e2e.mjs`.
5. Update docs when behavior changes: `docs/API.md` for endpoints, `docs/ARCHITECTURE.md` for design,
   `CHANGELOG.md` for user-visible changes.
6. Schema change? Add a new numbered file in `migrations/`; never edit an applied one.

## Checks that must pass

```bash
npm run typecheck
npx tsc -p functions/tsconfig.json
npm test
npm run build
npm run test:e2e      # when you touched functions/, server/, migrations/, or sync
```

CI runs the first four on every pull request.

For UI changes include a screenshot or short recording at a 375px width, and say what you tried (including
offline and sign-out cases where relevant).

## Pull requests

- Title in the imperative: "Add CSV import", not "Added CSV import".
- Describe what changed and why, how you tested it, and anything reviewers should look at closely.
- Do not include secrets, `.dev.vars`, `.wrangler/`, or your own `database_id` in `wrangler.toml`.

## Commit style

One-line imperative subject (about 50 characters), blank line, then a body explaining why.

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

By contributing you agree your contributions are licensed under the MIT License.
