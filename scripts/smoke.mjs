#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(projectRoot, 'artifacts', 'debug');
const logsDir = path.join(artifactsDir, 'logs');

function ensureDir(target) {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }
}

async function probe(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      url,
      snippet: text.slice(0, 200)
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      url,
      error: error.name === 'AbortError' ? 'timeout' : String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  ensureDir(artifactsDir);
  ensureDir(logsDir);

  const targets = [
    { name: 'healthz', url: 'http://localhost:3000/healthz' },
    { name: 'readyz', url: 'http://localhost:3000/readyz' },
    { name: 'livez', url: 'http://localhost:3000/livez' },
    { name: 'app-root', url: 'http://localhost:3000/' }
  ];

  const results = [];
  for (const target of targets) {
    // eslint-disable-next-line no-await-in-loop
    const result = await probe(target.url, { timeout: 5000 });
    results.push({ name: target.name, ...result });
  }

  const logPath = path.join(logsDir, 'smoke-results.json');
  writeFileSync(logPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2) + '\n', 'utf-8');

  const failures = results.filter((entry) => !entry.ok);
  if (failures.length) {
    console.error('Smoke checks failed:', failures.map((f) => `${f.name}:${f.error ?? f.status}`).join(', '));
    process.exitCode = 1;
  } else {
    console.log('Smoke checks passed.');
  }
}

main().catch((error) => {
  console.error('Smoke script encountered an unexpected error:', error);
  process.exitCode = 1;
});
