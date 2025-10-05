#!/usr/bin/env sh
set -eu
API_DEFAULT="${API_PLACEHOLDER:-https://g8h3ilc3k6q1.manus.space}"
API_VAR="${RENTGUY_API_URL:-$API_DEFAULT}"
echo "[rentguy-web] Rewriting API base to: $API_VAR"
if [ -d /usr/share/nginx/html/assets ]; then
  for f in /usr/share/nginx/html/assets/*.js; do
    [ -f "$f" ] || continue
    sed -i "s|https://g8h3ilc3k6q1.manus.space|$API_VAR|g" "$f" || true
  done
fi
