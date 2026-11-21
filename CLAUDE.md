# CLAUDE.md

Read and follow [AGENTS.md](AGENTS.md) before doing anything in this repo. It is the single source of truth for
commands, architecture, invariants, conventions, and how to deploy for a user.

@AGENTS.md

## Claude Code specifics

- Use the task list for multi-step work and finish with the checks listed under "Definition of done" in
  AGENTS.md. Do not report UI work as complete until you have used it in the browser at 375px width.
- Cloudflare login (`npx wrangler login`) is a human step. Ask the user to run it; never handle their
  credentials.
- Keep this file short. Put project knowledge in AGENTS.md so every agent tool benefits, and update AGENTS.md
  when you change an invariant, a command, or the architecture.
