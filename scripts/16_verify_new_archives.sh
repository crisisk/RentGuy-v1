#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVES=(
  "RentGuy_v1.1_MisterDJ_Final.zip"
  "Rentguy (2).zip"
  "rentguy-wp-control-suite-consolidation.zip"
  "rentguyapp_f6_web_calendar.zip"
  "rentguyapp_f7_f10.zip"
  "rentguyapp_onboarding_v0.zip"
  "rentguyapp_v1.0.zip"
)

missing=()
for archive in "${ARCHIVES[@]}"; do
  archive_path="${ROOT_DIR}/${archive}"
  if [[ ! -f "${archive_path}" ]]; then
    missing+=("${archive}")
    continue
  fi
  echo "[verify] ${archive}"
  unzip -tqq "${archive_path}" || {
    echo "Archive integrity check failed: ${archive}" >&2
    exit 1
  }
  echo "[ok] ${archive}"

done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing archives: ${missing[*]}" >&2
  exit 1
fi

echo "All archives verified successfully."
