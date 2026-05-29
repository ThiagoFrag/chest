#!/usr/bin/env bash
# Chest setup — run after `git clone`.
# Configures git identity (LOCAL, no global pollution), creates .env from
# template with generated secrets, and installs deps.

set -e

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

echo "Chest setup"
echo "==========="
echo

# 1. Git identity (local to this repo only)
if [ -z "$(git config --local user.email)" ]; then
  read -r -p "Git author email (for your commits): " GIT_EMAIL
  read -r -p "Git author name: " GIT_NAME
  git config --local user.email "$GIT_EMAIL"
  git config --local user.name "$GIT_NAME"
  echo "Configured git user.email/user.name (local only — does not touch your global config)"
else
  echo "Git identity already set ($(git config --local user.name) <$(git config --local user.email)>)"
fi

# 2. .env from template
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"

  if command -v openssl &> /dev/null; then
    SESSION_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
    RCON_KEY="$(openssl rand -base64 32 | tr -d '\n')"
    if command -v gsed &> /dev/null; then SED="gsed"; else SED="sed"; fi
    $SED -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
    $SED -i "s|^RCON_KEY=.*|RCON_KEY=$RCON_KEY|" .env
    echo "Generated SESSION_SECRET and RCON_KEY in .env"
  else
    echo "openssl not found — set SESSION_SECRET and RCON_KEY in .env manually (32+ random chars each)"
  fi
else
  echo ".env already exists — skipping (delete it to regenerate)"
fi

# 3. Install deps
if command -v bun &> /dev/null; then
  echo
  echo "Installing dependencies with bun..."
  bun install
else
  echo
  echo "Bun not installed. Install from https://bun.sh then run: bun install"
  exit 1
fi

# 4. Run migrations
echo
echo "Running database migrations..."
bun run db:migrate

echo
echo "Setup complete."
echo
echo "Next steps:"
echo "  1. Edit .env if needed (DOCKER_HOST, ORIGIN, etc)"
echo "  2. Start dev server: bun run dev"
echo "  3. Open http://localhost:3000"
echo "  4. First user becomes admin (or run: bun run seed:admin)"
