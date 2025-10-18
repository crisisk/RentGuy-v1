#!/usr/bin/env bash
set -Eeuo pipefail
SERVICE="${1:-service}"
URL="${2:-http://localhost:80/health}"
TIMEOUT="${3:-240}"
echo "[health] Waiting for $SERVICE at $URL (timeout ${TIMEOUT}s)"
SECS=0
while (( SECS < TIMEOUT )); do
  if curl -fsS "$URL" >/dev/null; then
    echo "[health] $SERVICE OK"; exit 0
  fi
  sleep 3; SECS=$((SECS+3))
done
echo "[health] TIMEOUT for $SERVICE"; exit 1
