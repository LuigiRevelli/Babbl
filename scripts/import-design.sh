#!/usr/bin/env bash
# Import a Claude Design handoff zip into frontend/public/prototype/
#
# Usage:
#   scripts/import-design.sh                       # auto-detects newest eee-handoff*.zip in ~/Downloads
#   scripts/import-design.sh /path/to/handoff.zip  # explicit zip path
#
# What it does:
#   1. Unzip the bundle to a temp dir
#   2. Copy *.html (top-level) + app/ + frames/ into frontend/public/prototype/
#   3. Stage the changes in git (commit + push happen automatically via the Stop hook)
#
# Exits non-zero on failure so it's safe to chain.

set -euo pipefail

PROJECT_ROOT="/Users/luigi/Desktop/Babbl"
TARGET="$PROJECT_ROOT/frontend/public/prototype"
DOWNLOADS="$HOME/Downloads"

zip_path="${1:-}"

if [[ -z "$zip_path" ]]; then
  zip_path="$(ls -t "$DOWNLOADS"/eee-handoff*.zip 2>/dev/null | head -1 || true)"
  if [[ -z "$zip_path" ]]; then
    echo "❌ No eee-handoff*.zip found in $DOWNLOADS. Pass a path explicitly." >&2
    exit 1
  fi
  echo "▸ Using newest handoff: $zip_path"
fi

if [[ ! -f "$zip_path" ]]; then
  echo "❌ Zip not found: $zip_path" >&2
  exit 1
fi

tmpdir="$(mktemp -d -t babbl-design-import.XXXXXX)"
trap 'rm -rf "$tmpdir"' EXIT

echo "▸ Unzipping $zip_path → $tmpdir"
unzip -o -q "$zip_path" -d "$tmpdir"

# Claude Design bundles are structured as <bundle>/eee/project/...
# Find the project dir (one level of nesting)
project_dir="$(find "$tmpdir" -maxdepth 3 -type d -name project -print -quit || true)"
if [[ -z "$project_dir" ]]; then
  echo "❌ No project/ directory found inside the zip. Expected structure: <root>/eee/project/" >&2
  exit 1
fi
echo "▸ Project dir: $project_dir"

mkdir -p "$TARGET" "$TARGET/app" "$TARGET/frames"

# Copy every top-level HTML file
shopt -s nullglob
for html in "$project_dir"/*.html; do
  echo "▸ html: $(basename "$html")"
  cp -f "$html" "$TARGET/"
done

# Copy optional app/ and frames/ component directories
if [[ -d "$project_dir/app" ]]; then
  echo "▸ app/ → prototype/app/"
  cp -rf "$project_dir/app/." "$TARGET/app/"
fi
if [[ -d "$project_dir/frames" ]]; then
  echo "▸ frames/ → prototype/frames/"
  cp -rf "$project_dir/frames/." "$TARGET/frames/"
fi

# Also copy the README if present (next to project/, one level up)
readme="$project_dir/../README.md"
if [[ -f "$readme" ]]; then
  cp -f "$readme" "$TARGET/HANDOFF_README.md"
  echo "▸ README → prototype/HANDOFF_README.md"
fi

# Stage for commit (Stop hook will auto-commit + push)
cd "$PROJECT_ROOT"
git add frontend/public/prototype/ 2>/dev/null || true

echo ""
echo "✅ Design handoff imported into $TARGET"
echo "   Preview: http://localhost:8080/prototype/$(ls "$TARGET"/*.html | head -1 | xargs basename | sed 's/ /%20/g')"
echo "   Changes are staged — the Stop hook will auto-commit + push when I finish this turn."
