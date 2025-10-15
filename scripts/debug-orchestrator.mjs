#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(projectRoot, 'artifacts', 'debug');
const logsDir = path.join(artifactsDir, 'logs');

const baselineFile = path.join(artifactsDir, 'baseline-findings.json');
const summaryFile = path.join(projectRoot, 'DEBUG_SUMMARY.json');
const triagePlanFile = path.join(artifactsDir, 'triage-plan.md');

function ensureDirectory(target) {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }
}

function runCommand(label, command, args, options = {}) {
  const logFile = path.join(logsDir, `${label}.log`);
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    encoding: 'utf-8',
    shell: false,
    ...options
  });

  const output = [result.stdout ?? '', result.stderr ?? ''].filter(Boolean).join('\n');
  writeFileSync(logFile, output, 'utf-8');

  return {
    label,
    command: `${command} ${args.join(' ')}`.trim(),
    status: result.status === 0 ? 'passed' : 'failed',
    code: result.status,
    signal: result.signal ?? null,
    output,
    error: result.error ? String(result.error) : null,
    logFile: path.relative(projectRoot, logFile)
  };
}

function writeJson(filePath, value) {
  writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf-8');
}

function readJson(filePath, fallback) {
  if (!existsSync(filePath)) {
    return fallback;
  }

  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to parse JSON from ${filePath}:`, error);
    return fallback;
  }
}

function handlePrep() {
  ensureDirectory(artifactsDir);
  ensureDirectory(logsDir);

  const summary = readJson(summaryFile, {
    status: 'unknown',
    lastUpdated: new Date().toISOString(),
    phases: {}
  });
  summary.status = 'pending';
  summary.lastUpdated = new Date().toISOString();
  summary.phases = summary.phases ?? {};
  summary.phases.prepare = {
    status: 'ok',
    notes: 'Artifacts directory prepared; awaiting scans.'
  };
  writeJson(summaryFile, summary);

  if (!existsSync(baselineFile)) {
    writeJson(baselineFile, []);
  }

  if (!existsSync(triagePlanFile)) {
    writeFileSync(
      triagePlanFile,
      '# Triage Plan\n\n| Cluster | Root cause (hypothesis) | Fix | Impact | Risk | Test to prove |\n| --- | --- | --- | --- | --- | --- |\n',
      'utf-8'
    );
  }

  console.log('Debug prep completed. Artifacts directory is ready.');
}

function handleScan() {
  ensureDirectory(artifactsDir);
  ensureDirectory(logsDir);

  const commands = [
    { phase: 'lint', command: 'npm', args: ['run', 'lint'] },
    { phase: 'typecheck', command: 'npm', args: ['run', 'typecheck'] },
    { phase: 'build', command: 'npm', args: ['run', 'build'] },
    { phase: 'db:migrate', command: 'npm', args: ['run', 'db:migrate'] },
    { phase: 'start:dev', command: 'npm', args: ['run', 'start:dev'] },
    { phase: 'smoke', command: 'npm', args: ['run', 'smoke'] },
    { phase: 'test', command: 'npm', args: ['run', 'test'] },
    { phase: 'e2e', command: 'npm', args: ['run', 'e2e'] }
  ];

  const findings = [];

  for (const entry of commands) {
    console.log(`Running ${entry.phase}...`);
    const result = runCommand(entry.phase, entry.command, entry.args);
    if (result.status !== 'passed') {
      findings.push({
        phase: entry.phase,
        error: result.output.split('\n').slice(-20).join('\n'),
        stack: null,
        file: null,
        line: null,
        fingerprint: `${entry.phase}:${result.code}`,
        suspected_cause: 'Pending triage',
        repro_steps: `${entry.command} ${entry.args.join(' ')}`.trim(),
        logFile: result.logFile
      });
    }
  }

  writeJson(baselineFile, findings);

  const summary = readJson(summaryFile, {
    status: 'unknown',
    lastUpdated: new Date().toISOString(),
    phases: {}
  });
  summary.lastUpdated = new Date().toISOString();
  summary.phases.scan = {
    status: findings.length === 0 ? 'ok' : 'failed',
    notes:
      findings.length === 0
        ? 'Baseline scan completed without failures.'
        : `Baseline scan recorded ${findings.length} failure(s). See ${path.relative(projectRoot, baselineFile)}.`
  };
  summary.status = findings.length === 0 ? 'ok' : 'failed';
  writeJson(summaryFile, summary);

  console.log(`Scan completed with ${findings.length} finding(s).`);
}

function handleRun() {
  const findings = readJson(baselineFile, []);
  const summary = readJson(summaryFile, {
    status: 'unknown',
    lastUpdated: new Date().toISOString(),
    phases: {}
  });

  const rows = findings.map((finding, index) => {
    const hypothesis =
      finding.error && finding.error.includes('npm ERR! code E403')
        ? 'Registry request blocked; offline or forbidden dependency download.'
        : 'Pending investigation.';
    const fix =
      finding.error && finding.error.includes('npm ERR! code E403')
        ? 'Mirror required dependencies or provide offline cache before rerunning pipeline.'
        : 'Investigate logs for more context.';
    const risk = 'low';
    const impact = finding.phase === 'lint' ? 'build-blocker' : 'unknown';
    const tests = `Re-run ${finding.repro_steps} after applying fix.`;
    return `| Cluster ${index + 1} | ${hypothesis} | ${fix} | ${impact} | ${risk} | ${tests} |`;
  });

  const header = '# Triage Plan\n\n| Cluster | Root cause (hypothesis) | Fix | Impact | Risk | Test to prove |\n| --- | --- | --- | --- | --- | --- |\n';
  writeFileSync(triagePlanFile, header + rows.join('\n') + (rows.length ? '\n' : ''), 'utf-8');

  summary.lastUpdated = new Date().toISOString();
  summary.phases.run = {
    status: findings.length === 0 ? 'ok' : 'blocked',
    notes:
      findings.length === 0
        ? 'No outstanding findings from baseline scan.'
        : 'Pending fixes for baseline findings; see triage plan.'
  };
  writeJson(summaryFile, summary);

  console.log('Run phase completed. Triage plan updated.');
}

const [, , command] = process.argv;

switch (command) {
  case 'prep':
    handlePrep();
    break;
  case 'scan':
    handleScan();
    break;
  case 'run':
    handleRun();
    break;
  default:
    console.error('Usage: node scripts/debug-orchestrator.mjs <prep|scan|run>');
    process.exitCode = 1;
}
