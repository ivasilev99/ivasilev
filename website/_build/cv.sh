#!/usr/bin/env bash
# Renders _build/cv.html to PDF with headless Chrome.
#   public copy (no phone) -> assets/cv/Ivan-Vasilev-CV.pdf (served by the site)
#   full copy (with phone) -> $1, default ~/Downloads/Ivan Vasilev CV.pdf
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(dirname "$HERE")"
FULL="${1:-$HOME/Downloads/Ivan Vasilev CV.pdf}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT

render() {
  "$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" \
    --no-pdf-header-footer --virtual-time-budget=3000 \
    --print-to-pdf="$2" "file://$HERE/cv.html$1" 2>/dev/null
}

render "?public" "$WEB/assets/cv/Ivan-Vasilev-CV.pdf"
render "" "$FULL"
echo "public: $WEB/assets/cv/Ivan-Vasilev-CV.pdf"
echo "full:   $FULL"
