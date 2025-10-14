#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const SCORE_GATES = {
  typeSafety: 95,
  errorHandling: 95,
  reusability: 95,
  maintainability: 95,
  documentation: 95,
}

const COVERAGE_GATES = {
  lines: 90,
  branches: 90,
  functions: 90,
  statements: 90,
}

const METRIC_LABELS = {
  typeSafety: 'Type Safety',
  errorHandling: 'Error Handling',
  reusability: 'Code Reusability',
  maintainability: 'Maintainability',
  documentation: 'Documentation',
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  'vendor',
  'migrations',
  '__pycache__',
  '.husky',
])

const readJsonIfExists = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`[quality-report] Unable to read ${filePath}:`, error.message)
    }
    return undefined
  }
}

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
}

const countLines = (content) => {
  if (!content) {
    return 0
  }
  return content.split(/\r?\n/).filter(Boolean).length
}

const clamp01 = (value) => Math.max(0, Math.min(1, value))

const sum = (values) => values.reduce((total, value) => total + value, 0)

const collectFiles = async (baseDir, extensions) => {
  const results = []

  const walk = async (currentDir) => {
    let dirEntries = []
    try {
      dirEntries = await fs.readdir(currentDir, { withFileTypes: true })
    } catch (error) {
      if (error.code === 'ENOENT') {
        return
      }
      throw error
    }

    for (const entry of dirEntries) {
      if (IGNORED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) {
        continue
      }

      const absolutePath = path.join(currentDir, entry.name)
      const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/')

      if (entry.isDirectory()) {
        await walk(absolutePath)
      } else if (extensions.includes(path.extname(entry.name))) {
        results.push(relativePath)
      }
    }
  }

  await walk(path.join(repoRoot, baseDir))
  return results
}

const readFiles = async (files) => {
  const contents = await Promise.all(
    files.map(async (relative) => {
      const absolute = path.join(repoRoot, relative)
      const content = await fs.readFile(absolute, 'utf8')
      return { relative, content }
    }),
  )
  return contents
}

const computeTypeSafety = async () => {
  const tsFiles = await collectFiles('src', ['.ts', '.tsx'])
  const jsFiles = await collectFiles('src', ['.js', '.jsx'])

  const legacyCandidates = ['App.jsx', 'Login.jsx', 'Planner.jsx', 'OnboardingOverlay.jsx', 'RoleSelection.jsx', 'TipBanner.jsx']
  const legacyJsx = (
    await Promise.all(
      legacyCandidates.map(async (file) => {
        const exists = await fileExists(path.join(repoRoot, file))
        return exists ? file : null
      }),
    )
  ).filter(Boolean)

  const tsContents = await readFiles(tsFiles)
  const jsContents = await readFiles([...jsFiles, ...legacyJsx])

  const tsLines = sum(tsContents.map(({ content }) => countLines(content)))
  const jsLines = sum(jsContents.map(({ content }) => countLines(content)))

  const ratio = clamp01(tsLines / Math.max(tsLines + jsLines, 1))
  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    evidence: [
      `tsFiles=${tsFiles.length}`,
      `jsFiles=${jsFiles.length}`,
      `tsLines=${tsLines}`,
      `jsLines=${jsLines}`,
    ],
  }
}

const computeErrorHandling = async () => {
  const frontendFiles = [
    ...(await collectFiles('src', ['.js', '.jsx', '.ts', '.tsx'])),
  ]

  const backendFiles = await collectFiles('backend/app', ['.py'])

  const legacyFrontendCandidates = ['App.jsx', 'Scanner.jsx', 'scanner.jsx']
  const legacyFrontend = (
    await Promise.all(
      legacyFrontendCandidates.map(async (file) => {
        const exists = await fileExists(path.join(repoRoot, file))
        return exists ? file : null
      }),
    )
  ).filter(Boolean)

  const files = [...frontendFiles, ...backendFiles, ...legacyFrontend]
  const contents = await readFiles(files)

  let riskEvents = 0
  let handledEvents = 0

  const riskPatterns = [/throw\s+new/gi, /throw\s+[^(]/gi, /raise\s+/gi]
  const handlerPatterns = [/catch\s*\(/gi, /try\s*[{:]/gi, /except\s+/gi, /AppError/gi, /Result\.fail/gi]

  for (const { content } of contents) {
    for (const pattern of riskPatterns) {
      riskEvents += (content.match(pattern) || []).length
    }
    for (const pattern of handlerPatterns) {
      handledEvents += (content.match(pattern) || []).length
    }
  }

  const ratio = clamp01(handledEvents / Math.max(riskEvents || handledEvents, 1))
  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    evidence: [
      `filesAnalysed=${files.length}`,
      `riskEvents=${riskEvents}`,
      `handledEvents=${handledEvents}`,
    ],
  }
}

const computeReusability = async () => {
  const reusableFiles = [
    ...(await collectFiles('src/core', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('src/domain', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('src/infrastructure', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('src/ui', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('backend/app/core', ['.py'])),
    ...(await collectFiles('backend/app/modules', ['.py'])),
  ]
  const allFiles = [
    ...(await collectFiles('src', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('backend/app', ['.py'])),
  ]

  const ratio = clamp01(reusableFiles.length / Math.max(allFiles.length, 1))
  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    evidence: [
      `reusableFiles=${reusableFiles.length}`,
      `totalFiles=${allFiles.length}`,
    ],
  }
}

const computeMaintainability = async () => {
  const files = [
    ...(await collectFiles('src', ['.js', '.jsx', '.ts', '.tsx'])),
    ...(await collectFiles('backend/app', ['.py'])),
  ]
  const contents = await readFiles(files)

  const lineCounts = contents.map(({ content }) => countLines(content))
  const totalLines = sum(lineCounts)
  const averageLines = lineCounts.length ? totalLines / lineCounts.length : 0
  const maxLines = lineCounts.length ? Math.max(...lineCounts) : 0

  const averagePenalty = Math.max(0, (averageLines - 120) / 400)
  const maxPenalty = Math.max(0, (maxLines - 400) / 400)
  const ratio = clamp01(1 - clamp01((averagePenalty + maxPenalty) / 2))

  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    evidence: [
      `filesAnalysed=${files.length}`,
      `averageLines=${Number(averageLines.toFixed(2))}`,
      `maxLines=${maxLines}`,
      `totalLines=${totalLines}`,
    ],
  }
}

const computeDocumentation = async () => {
  const expectedArtifacts = [
    'docs/GETTING_STARTED.md',
    'docs/ARCHITECTURE.md',
    'docs/QUALITY_GATES.md',
    'docs/api/README.md',
    'docs/RUNBOOKS/README.md',
    'docs/quality-improvement-plan.md',
  ]

  let available = 0
  const missing = []

  for (const artifact of expectedArtifacts) {
    const present = await fileExists(path.join(repoRoot, artifact))
    if (present) {
      available += 1
    } else {
      missing.push(artifact)
    }
  }

  const ratio = clamp01(available / expectedArtifacts.length)

  const score = Number((ratio * 100).toFixed(2))

  return {
    score,
    evidence: [
      `available=${available}/${expectedArtifacts.length}`,
      missing.length ? `missing=${missing.join(',')}` : 'missing=none',
    ],
  }
}

const computeTestCoverage = async () => {
  const coveragePath = path.join(repoRoot, 'coverage', 'coverage-summary.json')
  const coverage = await readJsonIfExists(coveragePath)

  if (!coverage) {
    return {
      lines: 0,
      branches: 0,
      functions: 0,
      statements: 0,
    }
  }

  const lines = coverage.total?.lines?.pct ?? 0
  const functions = coverage.total?.functions?.pct ?? 0
  const branches = coverage.total?.branches?.pct ?? 0
  const statements = coverage.total?.statements?.pct ?? 0

  return {
    lines,
    functions,
    branches,
    statements,
  }
}

const METRIC_COMPUTERS = {
  typeSafety: computeTypeSafety,
  errorHandling: computeErrorHandling,
  reusability: computeReusability,
  maintainability: computeMaintainability,
  documentation: computeDocumentation,
}

const QUALITY_METRIC_KEYS = Object.keys(METRIC_COMPUTERS)

const buildSummaryMarkdown = (current, previous) => {
  const header = `# Quality Summary\n\nGenerated at: ${current.generatedAt}\n\n`

  const tableHeader = '| Metric | Previous | Current | Delta | Gate | Status |\n| --- | --- | --- | --- | --- | --- |\n'

  const rows = QUALITY_METRIC_KEYS.map((key) => {
    const metric = current.metrics[key]
    const label = METRIC_LABELS[key]
    const gate = SCORE_GATES[key]
    const previousScore = previous?.metrics?.[key]?.score ?? null
    const delta = previousScore !== null ? (metric.score - previousScore).toFixed(2) : 'n/a'
    const status = metric.score >= gate ? '✅' : '⚠️'
    const previousDisplay = previousScore !== null ? previousScore.toFixed(2) : 'n/a'
    return `| ${label} | ${previousDisplay} | ${metric.score.toFixed(2)} | ${delta} | ${gate} | ${status} |`
  }).join('\n')

  const overallStatus = current.overallQualityIndex >= 95 ? '✅' : '⚠️'
  const overallSection = `\n\n**Overall Quality Index:** ${current.overallQualityIndex.toFixed(2)} (${overallStatus})\n`

  const nextActions = QUALITY_METRIC_KEYS.filter((key) => current.metrics[key].score < SCORE_GATES[key])
    .sort((a, b) => current.metrics[a].score - current.metrics[b].score)
    .slice(0, 5)
    .map((key) => `- ${METRIC_LABELS[key]} below gate (${current.metrics[key].score.toFixed(2)}%). Follow evidence to remediate.`)

  const coverage = current.metrics.coverage
  const coverageSection = coverage
    ? `\n## Coverage\n| Metric | Current | Gate | Status |\n| --- | --- | --- | --- |\n| Lines | ${coverage.lines.toFixed(2)} | ${COVERAGE_GATES.lines} | ${coverage.lines >= COVERAGE_GATES.lines ? '✅' : '⚠️'} |\n| Functions | ${coverage.functions.toFixed(2)} | ${COVERAGE_GATES.functions} | ${coverage.functions >= COVERAGE_GATES.functions ? '✅' : '⚠️'} |\n| Branches | ${coverage.branches.toFixed(2)} | ${COVERAGE_GATES.branches} | ${coverage.branches >= COVERAGE_GATES.branches ? '✅' : '⚠️'} |\n| Statements | ${coverage.statements.toFixed(2)} | ${COVERAGE_GATES.statements} | ${coverage.statements >= COVERAGE_GATES.statements ? '✅' : '⚠️'} |`
    : ''

  const nextActionsSection = nextActions.length
    ? `\n## Next Actions\n${nextActions.join('\n')}\n`
    : '\n## Next Actions\n- All tracked metrics meet targets. Maintain guardrails.\n'

  return `${header}${tableHeader}${rows}${overallSection}${coverageSection}${nextActionsSection}`
}

const buildReportPayload = (metrics, coverage) => ({
  version: 1,
  generatedAt: new Date().toISOString(),
  metrics: {
    ...metrics,
    coverage,
  },
  overallQualityIndex: Number(
    (
      QUALITY_METRIC_KEYS.reduce((total, key) => total + metrics[key].score, 0) /
      QUALITY_METRIC_KEYS.length
    ).toFixed(2),
  ),
  gates: {
    ...SCORE_GATES,
    coverage: COVERAGE_GATES,
  },
})

const main = async () => {
  const previous = await readJsonIfExists(path.join(repoRoot, 'quality-report.json'))
  const metrics = {}

  for (const [key, calculator] of Object.entries(METRIC_COMPUTERS)) {
    // eslint-disable-next-line no-await-in-loop
    metrics[key] = await calculator()
  }

  const coverage = await computeTestCoverage()

  const report = buildReportPayload(metrics, coverage)

  await fs.writeFile(path.join(repoRoot, 'quality-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  await fs.writeFile(
    path.join(repoRoot, 'docs', 'QUALITY_SUMMARY.md'),
    `${buildSummaryMarkdown(report, previous)}\n`,
  )

  console.log('[quality-report] Report generated successfully.')
}

main().catch((error) => {
  console.error('[quality-report] Failed to generate report:', error)
  process.exitCode = 1
})
