#!/usr/bin/env bash
# Upload the site to S3 (eu-central-1) and refresh CloudFront.
# Usage: website/infra/deploy.sh    (run `tofu apply` in website/infra/ first)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFRA="$ROOT/infra"
PROFILE="${AWS_PROFILE:-ivasilev}"

cd "$INFRA"
BUCKET="$(tofu output -raw bucket)"
DIST="$(tofu output -raw distribution_id)"
URL="$(tofu output -raw url)"

cd "$ROOT"
node _build/build.mjs

# Only publish files that are tracked by git (or would be), minus build/infra tooling.
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
git ls-files --cached --others --exclude-standard \
  | grep -vE '^(_build/|infra/|\.gitignore$|README\.md$)' \
  | while IFS= read -r f; do
      [ -f "$f" ] || continue
      mkdir -p "$STAGE/$(dirname "$f")"
      cp "$f" "$STAGE/$f"
    done

echo "→ s3://$BUCKET ($(find "$STAGE" -type f | wc -l | tr -d ' ') files)"

# Long cache for static assets, short cache for HTML/CSS/JS (no hashed filenames).
aws s3 sync "$STAGE" "s3://$BUCKET" --profile "$PROFILE" --delete --only-show-errors \
  --exclude '*.html' --exclude '*.css' --exclude '*.js' \
  --cache-control 'public, max-age=604800'
aws s3 sync "$STAGE" "s3://$BUCKET" --profile "$PROFILE" --delete --only-show-errors \
  --exclude '*' --include '*.html' --include '*.css' --include '*.js' \
  --cache-control 'public, max-age=300, must-revalidate'

aws cloudfront create-invalidation --profile "$PROFILE" \
  --distribution-id "$DIST" --paths '/*' --query 'Invalidation.Id' --output text >/dev/null

echo "✓ deployed → $URL"
