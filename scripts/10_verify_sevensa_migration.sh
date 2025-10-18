#!/usr/bin/env bash
set -Eeuo pipefail
echo "[verify] Sevensa migration double-check"
DOMAINS=("psra.sevensa.nl" "rentguy.sevensa.nl" "ai.sevensa.nl" "trading.sevensa.nl" "n8n.sevensa.nl" "auth.sevensa.nl")
LEGACY=("ai.dakslopers.nl" "trading.dakslopers.nl")
IP=$(curl -s https://api.ipify.org || true)
echo "[verify] VPS public IP: ${IP:-unknown}"
for d in "${DOMAINS[@]}"; do echo "== $d =="; dig +short A "$d"; dig +short AAAA "$d"; done
echo "[verify] Legacy domains"
for d in "${LEGACY[@]}"; do echo "== $d =="; dig +short A "$d"; code=$(curl -s -o /dev/null -w '%{http_code}' "https://$d" || true); loc=$(curl -sI "https://$d" | awk '/^location:/ {print $2}' | tr -d '\r'); echo "HTTP: $code Location: ${loc:-none}"; done
grep -RIn --exclude-dir=.git -E 'dakslopers|VKG' . || true
