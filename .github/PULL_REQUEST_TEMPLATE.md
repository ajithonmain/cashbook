## What and why

<!-- What does this change, and why is it needed? -->

## How I tested it

- [ ] `npm run typecheck` and `npx tsc -p functions/tsconfig.json`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e` (if I touched `functions/`, `server/`, `migrations/`, or sync)
- [ ] Used the feature at 375px width (UI changes), including offline and sign-out where relevant

## Checklist

- [ ] I kept the invariants in AGENTS.md (user scoping, soft deletes, SQL-level last-write-wins, migrations are new files)
- [ ] I updated docs and CHANGELOG.md for user-visible changes
- [ ] No secrets, `.dev.vars`, or personal `database_id` included
