#!/usr/bin/env bash
# Bumps the chat-widget version in version.json and index.html
# Run manually: ./scripts/bump-version.sh
# Or let .githooks/pre-commit do it automatically when chat-widget.{css,js}
# is staged for commit.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NEW_VERSION="$(date -u +%Y%m%d-%H%M)"
ISO_NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# 1) version.json
cat > version.json <<EOF
{
  "version": "$NEW_VERSION",
  "deployed_at": "$ISO_NOW",
  "feature": "chat-widget"
}
EOF

# 2) index.html — bump ?v=YYYYMMDD-HHMM on chat-widget.{css,js}
# Use # as sed delimiter so the | in the regex alternation isn't ambiguous.
# macOS sed needs a backup suffix; we delete the backup right after.
sed -i.bak -E "s#(chat-widget\.(css|js))\?v=[0-9A-Za-z-]+#\1?v=$NEW_VERSION#g" index.html
rm -f index.html.bak

echo "✓ Bumped to $NEW_VERSION"
echo "  - version.json"
echo "  - index.html (chat-widget.css?v= and chat-widget.js?v=)"
