#!/usr/bin/env bash
set -Eeuo pipefail
SRC=${WPCTL_CODE_ZIP:-/root/wp-control-suite.zip}
DEST=./wp-control-suite
if [[ ! -f "$SRC" ]]; then
  echo "[wpctl] Geen code-archive gevonden op $SRC"; exit 1
fi
mkdir -p "$DEST"
case "$SRC" in
  *.zip) unzip -o "$SRC" -d "$DEST" ;;
  *.tar.gz|*.tgz) tar -xzf "$SRC" -C "$DEST" ;;
  *.tar) tar -xf "$SRC" -C "$DEST" ;;
  *) echo "[wpctl] Onbekend archief-formaat: $SRC"; exit 1 ;;
esac
echo "[wpctl] Code uitgepakt naar $DEST"
