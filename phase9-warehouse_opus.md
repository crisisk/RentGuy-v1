# Opus – Phase 9 (Warehouse PWA) – Superprompt

Goal: Harden QR scanning PWA, add offline queue, and bundle scan logic.

Tasks:
1) Replace MVP scan mapping with ItemTag resolution; design ItemTag schema.
2) Add IndexedDB offline queue + retry strategy.
3) Implement 'bundle explode' vs 'book all' UX flow.
4) Lighthouse PWA audit (min 90). Provide patch notes.
Output: PR diffs + new schema migration + offline-queue.js.
