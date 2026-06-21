# Contributing to Chest

Thanks for considering a contribution. Chest is an early-stage open-source project; the bar for changes is moderate quality + good tests, not perfection.

## Dev setup

```bash
git clone https://github.com/ThiagoFrag/chest.git
cd chest
bash scripts/setup.sh    # interactively configures git identity + .env + deps
bun run dev
```

The setup script asks for your git email/name and stores them LOCALLY to this repo (does not modify your global git config). Generates random `SESSION_SECRET` and `RCON_KEY` in `.env`.

Panel runs on http://localhost:3000.

## Tests

Always run before submitting a PR:

```bash
bun run check    # svelte-check + tsc
bun test         # vitest suite (currently 107 tests)
```

## Pull requests

- Keep changes focused — one feature or fix per PR.
- Update tests when you change behavior. Add new tests for new code.
- Reference any related issue in the PR description.
- The maintainer will respond within 7 days. If it takes longer, ping.

## Reporting bugs

Use GitHub issues with the bug template. Include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Logs (panel + relevant container)
- Your environment (Docker version, host OS)

## Adding an Egg (template)

Eggs are declarative JSON files in `/eggs/<name>.json`. See `src/lib/eggs/types.ts` for the schema. PR new eggs as separate commits.

## Security

Report security issues privately. See SECURITY.md.
