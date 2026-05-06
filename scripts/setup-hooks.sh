#!/usr/bin/env bash
# One-time setup: tells git to use .githooks/ instead of .git/hooks/
# Run once after cloning the repo:
#   ./scripts/setup-hooks.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit scripts/bump-version.sh

echo "✓ Git hooks aktiviert"
echo "  Bei jedem Commit, der chat-widget.css oder chat-widget.js ändert,"
echo "  wird die Version in version.json und index.html automatisch gebumpt."
