#!/usr/bin/env bash
set -Eeuo pipefail
grep -RIn --exclude-dir=.git -E 'dakslopers|trading\.dakslopers|ai\.dakslopers|VKG' . || true
